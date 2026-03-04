/**
 * Creator Profile Routes
 * API endpoints for creator profile operations
 */

import express from "express";
import {
  createProfile,
  getProfile,
  getMyProfile,
  updateProfile,
  addCompetitor,
  removeCompetitor,
  updatePlatforms,
  completeOnboarding,
  deleteProfile,
  getProfilesByStatus,
  getProfilesByNiche,
} from "../controllers/creatorProfileController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Public routes (no authentication required)
 */

// Get profile by ID - public access
router.get("/creator-profiles/:creatorId", getProfile);

// Get profiles by status - public access
router.get("/creator-profiles/status/:status", getProfilesByStatus);

// Get profiles by niche - public access
router.get("/creator-profiles/niche/:primaryNiche", getProfilesByNiche);

/**
 * Protected routes (authentication required)
 */

// Create new creator profile - requires auth
router.post("/creator-profiles", authMiddleware, createProfile);

// Get authenticated user's profile
router.get("/creator-profiles/me/profile", authMiddleware, getMyProfile);

// Update profile - requires auth
router.put("/creator-profiles/:creatorId", authMiddleware, updateProfile);

// Add competitor - requires auth
router.post(
  "/creator-profiles/:creatorId/competitors",
  authMiddleware,
  addCompetitor,
);

// Remove competitor - requires auth
router.delete(
  "/creator-profiles/:creatorId/competitors/:competitorId",
  authMiddleware,
  removeCompetitor,
);

// Update platforms - requires auth
router.patch(
  "/creator-profiles/:creatorId/platforms",
  authMiddleware,
  updatePlatforms,
);

// Complete onboarding - requires auth
router.patch(
  "/creator-profiles/:creatorId/complete-onboarding",
  authMiddleware,
  completeOnboarding,
);

// Delete profile - requires auth
router.delete("/creator-profiles/:creatorId", authMiddleware, deleteProfile);

/**
 * Export router for use in app.js
 * Usage in app.js:
 *
 * import creatorProfileRoutes from './routes/creatorProfileRoutes.js';
 * app.use('/api', creatorProfileRoutes);
 */

export default router;
