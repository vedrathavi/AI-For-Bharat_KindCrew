import axios from "axios";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const COGNITO_CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET;
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * Exchange authorization code for Cognito tokens
 */
export const exchangeCodeForTokens = async (code, redirectUri) => {
  try {
    const tokenUrl = `${COGNITO_DOMAIN}/oauth2/token`;
    const credentials = Buffer.from(
      `${COGNITO_CLIENT_ID}:${COGNITO_CLIENT_SECRET}`,
    ).toString("base64");

    const { data } = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: COGNITO_CLIENT_ID,
        code,
        redirect_uri: redirectUri,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
      },
    );

    return {
      accessToken: data.access_token,
      idToken: data.id_token,
      refreshToken: data.refresh_token,
    };
  } catch (error) {
    console.error(
      "❌ Token exchange failed:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

/**
 * Get user info from ID token
 */
export const getCognitoUser = async (idToken) => {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

    let identityProvider = "cognito";
    if (payload.identities && Array.isArray(payload.identities)) {
      // User logged in via federated provider (Google, Facebook, etc.)
      const googleIdentity = payload.identities.find(
        (id) => id.providerType === "Google",
      );
      if (googleIdentity) {
        identityProvider = "google";
      }
    }

    return {
      cognitoId: payload.sub,
      email: payload.email,
      name: payload.name,
      givenName: payload.given_name || null,
      familyName: payload.family_name || null,
      profileImage: payload.picture || null,
      emailVerified: payload.email_verified || false,
      locale: payload.locale || null,
      updatedAt: payload.updated_at || null,
      identityProvider: identityProvider, // "cognito" or "google"
    };
  } catch (error) {
    console.error("❌ Failed to decode ID token:", error.message);
    return null;
  }
};

/**
 * Generate custom JWT token for API
 */
export const generateToken = (
  userId,
  email,
  name = null,
  givenName = null,
  familyName = null,
) => {
  return jwt.sign(
    {
      userId,
      email,
      name,
      givenName,
      familyName,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
};

/**
 * Verify custom API JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return null;
  }
};

/**
 * Generate Cognito authorization URL
 */
export const getAuthorizationUrl = (state, nonce) => {
  const redirectUri = process.env.COGNITO_REDIRECT_URI;

  const params = new URLSearchParams({
    client_id: COGNITO_CLIENT_ID,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirectUri,
    state,
    nonce,
  });

  return `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
};
