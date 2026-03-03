import userService from "../services/user.service.js";
import {
  exchangeCodeForTokens,
  getCognitoUser,
  generateToken,
  getAuthorizationUrl,
} from "../utils/cognito.js";
import crypto from "crypto";

/**
 * Initiate OAuth login flow - redirect to Cognito
 */
export const handleLogin = (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    const nonce = crypto.randomBytes(16).toString("hex");

    req.session.oauthState = state;
    req.session.oauthNonce = nonce;

    const authUrl = getAuthorizationUrl(state, nonce);
    console.log("🔐 OAuth flow initiated");

    res.redirect(authUrl);
  } catch (error) {
    console.error("❌ Login failed:", error.message);
    res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:3000"}?error=login_failed`,
    );
  }
};

/**
 * Handle OAuth callback from Cognito
 */
export const handleCallback = async (req, res) => {
  console.log("\n========== CALLBACK START ==========");
  try {
    const { code, state, error, error_description } = req.query;

    console.log("📥 OAuth callback received");
    console.log("Code:", code ? `${code.substring(0, 20)}...` : "MISSING");
    console.log("State:", state ? `${state.substring(0, 20)}...` : "MISSING");
    console.log(
      "Session state:",
      req.session.oauthState
        ? `${req.session.oauthState.substring(0, 20)}...`
        : "MISSING",
    );

    if (error) {
      console.error("❌ Cognito error:", error, error_description);
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:3000"}?error=${error}`,
      );
    }

    if (!state || state !== req.session.oauthState) {
      console.error("❌ State mismatch - possible CSRF attack");
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:3000"}?error=invalid_state`,
      );
    }

    if (!code) {
      console.error("❌ No auth code received from Cognito");
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:3000"}?error=missing_code`,
      );
    }

    try {
      // Exchange code for tokens
      console.log("\n🔄 Step 1: Exchanging auth code...");
      const tokens = await exchangeCodeForTokens(
        code,
        process.env.COGNITO_REDIRECT_URI,
      );
      console.log("✅ Step 1 complete: Tokens received");
      console.log("Has access token:", !!tokens.accessToken);
      console.log("Has ID token:", !!tokens.idToken);

      // Get user from ID token
      console.log("\n👤 Step 2: Extracting user from ID token...");
      const cognitoUser = await getCognitoUser(tokens.idToken);
      console.log("✅ Step 2 complete");
      console.log("Cognito user:", cognitoUser);

      if (!cognitoUser) {
        console.error("❌ Failed to extract user from token");
        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:3000"}?error=invalid_token`,
        );
      }

      // Create or update user in database
      console.log("\n💾 Step 3: Creating/updating user in database...");
      console.log(`📍 Login method: ${cognitoUser.identityProvider}`);
      let user;
      try {
        user = await userService.findOrCreateUser(
          cognitoUser.email,
          cognitoUser.name,
          cognitoUser.identityProvider, // "cognito" or "google"
          {
            profileImage: cognitoUser.profileImage,
            cognitoId: cognitoUser.cognitoId,
            givenName: cognitoUser.givenName,
            familyName: cognitoUser.familyName,
            emailVerified: cognitoUser.emailVerified,
            locale: cognitoUser.locale,
          },
        );
        console.log("✅ Step 3 complete: User in database");
        console.log("User:", user);
      } catch (dbError) {
        console.error("⚠️  Database error:", dbError.message);
        console.error("DB Error details:", dbError);
        // Fallback: create mock user if database fails
        user = {
          userId: `cognito-${cognitoUser.cognitoId}`,
          email: cognitoUser.email,
          name: cognitoUser.name,
          profileImage: cognitoUser.profileImage,
          cognitoId: cognitoUser.cognitoId,
          givenName: cognitoUser.givenName,
          familyName: cognitoUser.familyName,
          emailVerified: cognitoUser.emailVerified,
        };
        console.log("✅ Step 3 complete (fallback): Using mock user");
      }

      // Generate API token
      console.log("\n🔑 Step 4: Generating API token...");
      const apiToken = generateToken(user.userId, user.email);
      console.log("✅ Step 4 complete: API token generated");

      // Store in session
      console.log("\n💾 Step 5: Storing in session...");
      req.session.user = {
        userId: user.userId,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
      };
      req.session.token = apiToken;

      delete req.session.oauthState;
      delete req.session.oauthNonce;
      console.log("✅ Step 5 complete: Session updated");

      console.log("\n✅ AUTHENTICATION SUCCESSFUL!");
      console.log("User email:", user.email);
      const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?token=${apiToken}`;
      console.log("Redirecting to:", redirectUrl);
      console.log("========== CALLBACK END ==========\n");

      res.redirect(redirectUrl);
    } catch (stepError) {
      console.error("\n❌ STEP ERROR:");
      console.error("Message:", stepError.message);
      console.error("Stack:", stepError.stack);
      throw stepError;
    }
  } catch (error) {
    console.error("\n❌ CALLBACK EXCEPTION:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("Full error:", error);
    console.log("========== CALLBACK END (ERROR) ==========\n");
    res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:3000"}?error=auth_failed`,
    );
  }
};

/**
 * Handle logout - destroy session and redirect to Cognito logout
 */
export const handleLogout = (req, res) => {
  try {
    console.log(
      "🚪 Logout initiated for user:",
      req.session.user?.email || "unknown",
    );

    // Destroy backend session
    req.session.destroy((err) => {
      if (err) {
        console.error("❌ Session destroy error:", err.message);
      }
    });

    // Build Cognito logout URL
    const cognitoDomain = process.env.COGNITO_DOMAIN;
    const clientId = process.env.COGNITO_CLIENT_ID;
    const logoutUri = process.env.FRONTEND_URL || "http://localhost:3000";

    const cognitoLogoutUrl =
      `${cognitoDomain}/logout?` +
      `client_id=${clientId}&` +
      `logout_uri=${encodeURIComponent(logoutUri)}`;

    console.log("✅ Session destroyed, redirecting to Cognito logout");

    // Redirect to Cognito logout (clears Cognito session cookies)
    res.redirect(cognitoLogoutUrl);
  } catch (error) {
    console.error("❌ Logout failed:", error.message);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}`);
  }
};
