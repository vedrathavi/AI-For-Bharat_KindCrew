import { verifyToken } from "../utils/cognito.js";
import { errorResponse } from "../utils/response.js";

/**
 * Middleware to verify JWT token
 * Extracts userId from token and adds it to request
 */
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    const sessionToken = req.session?.token;
    const token = bearerToken || req.cookies?.authToken || sessionToken;

    if (!token) {
      return res
        .status(401)
        .json(errorResponse("Unauthorized", "No token provided"));
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res
        .status(401)
        .json(errorResponse("Unauthorized", "Invalid token"));
    }

    // Attach userId to request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    next();
  } catch (error) {
    return res.status(401).json(errorResponse("Unauthorized", error.message));
  }
};
