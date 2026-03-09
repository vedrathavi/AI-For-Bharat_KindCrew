import userService from "../services/user.service.js";
import creatorProfileService from "../services/creatorProfile.service.js";
import {
  exchangeCodeForTokens,
  getCognitoUser,
  generateToken,
  getAuthorizationUrl,
} from "../utils/cognito.js";
import crypto from "crypto";

const getFrontendBaseUrl = (req) => {
  const configuredUrl = (process.env.FRONTEND_URL || "").trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return `${req.protocol}://${req.get("host")}`;
};

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
    res.redirect(authUrl);
  } catch (error) {
    console.error("Login failed:", error.message);
    const frontendBaseUrl = getFrontendBaseUrl(req);
    res.redirect(`${frontendBaseUrl}?error=login_failed`);
  }
};

/**
 * Handle OAuth callback from Cognito
 */
export const handleCallback = async (req, res) => {
  try {
    const frontendBaseUrl = getFrontendBaseUrl(req);
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${frontendBaseUrl}?error=${error}`);
    }

    if (!state || state !== req.session.oauthState) {
      return res.redirect(`${frontendBaseUrl}?error=invalid_state`);
    }

    if (!code) {
      return res.redirect(`${frontendBaseUrl}?error=missing_code`);
    }

    const tokens = await exchangeCodeForTokens(
      code,
      process.env.COGNITO_REDIRECT_URI,
    );

    const cognitoUser = await getCognitoUser(tokens.idToken);

    if (!cognitoUser) {
      return res.redirect(`${frontendBaseUrl}?error=invalid_token`);
    }

    let user;
    try {
      user = await userService.findOrCreateUser(
        cognitoUser.email,
        cognitoUser.name,
        cognitoUser.identityProvider,
        {
          profileImage: cognitoUser.profileImage,
          cognitoId: cognitoUser.cognitoId,
          givenName: cognitoUser.givenName,
          familyName: cognitoUser.familyName,
          emailVerified: cognitoUser.emailVerified,
          locale: cognitoUser.locale,
        },
      );
    } catch (dbError) {
      console.error("Database error during callback:", dbError.message);
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
    }

    const apiToken = generateToken(
      user.userId,
      user.email,
      user.name,
      user.givenName,
      user.familyName,
    );

    req.session.user = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
    };
    req.session.token = apiToken;

    delete req.session.oauthState;
    delete req.session.oauthNonce;

    let redirectPath = "/onboarding";
    try {
      const profile = await creatorProfileService.getProfileByUserId(
        user.userId,
      );
      if (profile) redirectPath = "/dashboard";
    } catch (_error) {
      // Default onboarding when profile lookup fails.
    }

    const redirectUrl = `${frontendBaseUrl}${redirectPath}?token=${apiToken}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Callback failed:", error.message);
    const frontendBaseUrl = getFrontendBaseUrl(req);
    res.redirect(`${frontendBaseUrl}?error=auth_failed`);
  }
};

/**
 * Handle logout - destroy session and redirect to Cognito logout
 */
export const handleLogout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err.message);
      }
    });

    const cognitoDomain = process.env.COGNITO_DOMAIN;
    const clientId = process.env.COGNITO_CLIENT_ID;
    const logoutUri = getFrontendBaseUrl(req);

    const cognitoLogoutUrl =
      `${cognitoDomain}/logout?` +
      `client_id=${clientId}&` +
      `logout_uri=${encodeURIComponent(logoutUri)}`;

    res.redirect(cognitoLogoutUrl);
  } catch (error) {
    console.error("Logout failed:", error.message);
    const frontendBaseUrl = getFrontendBaseUrl(req);
    res.redirect(frontendBaseUrl);
  }
};
