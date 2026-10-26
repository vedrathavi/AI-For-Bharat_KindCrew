import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
} from "../src/modules/creator-profile/creatorProfile.controller.js";
import {
  addCompetitor,
  removeCompetitor,
  updatePlatforms,
  completeOnboarding,
} from "../controllers/creatorProfileController.js";

const router = express.Router();

/**
 * Legacy API routes mapped to secure modular controller actions.
 * Derives authenticated context strictly from req.userId, preventing IDOR.
 */

// Create profile (supports both singular /creator-profile and plural /creator-profiles)
router.post(["/creator-profile", "/creator-profiles"], authMiddleware, createProfile);

// Get profile
router.get(["/creator-profile", "/creator-profiles/me/profile"], authMiddleware, getProfile);

// Update profile (ignores creatorId parameter and updates req.userId profile)
router.put(["/creator-profile", "/creator-profiles/:creatorId"], authMiddleware, updateProfile);

// Delete profile
router.delete(["/creator-profile", "/creator-profiles/:creatorId"], authMiddleware, deleteProfile);

// Competitor and Platform updates (sub-resource routes)
router.post(
  "/creator-profiles/:creatorId/competitors",
  authMiddleware,
  addCompetitor,
);
router.delete(
  "/creator-profiles/:creatorId/competitors/:competitorId",
  authMiddleware,
  removeCompetitor,
);
router.patch(
  "/creator-profiles/:creatorId/platforms",
  authMiddleware,
  updatePlatforms,
);
router.patch(
  "/creator-profiles/:creatorId/complete-onboarding",
  authMiddleware,
  completeOnboarding,
);

export default router;
