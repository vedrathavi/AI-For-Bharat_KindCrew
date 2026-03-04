/**
 * Creator Profile Controller
 * Handles HTTP requests for creator profile operations
 * Delegates business logic to creatorProfileService
 */

import creatorProfileService from "../services/creatorProfile.service.js";

/**
 * Create a new creator profile
 * POST /api/creator-profiles
 */
export const createProfile = async (req, res) => {
  try {
    const userId = req.userId || req.user?.userId; // From auth middleware
    const profileData = req.body;

    console.log("🎯 [CONTROLLER] createProfile called");
    console.log("👤 [CONTROLLER] userId:", userId);
    console.log(
      "📨 [CONTROLLER] req.body competitors:",
      profileData?.competitors,
    );
    console.log(
      "📊 [CONTROLLER] Full profileData keys:",
      Object.keys(profileData || {}),
    );

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: missing user context",
      });
    }

    if (!profileData) {
      return res.status(400).json({
        success: false,
        error: "Profile data is required",
      });
    }

    const profile = await creatorProfileService.createProfile(
      userId,
      profileData,
    );

    res.status(201).json({
      success: true,
      data: profile,
      message: "Creator profile created successfully",
    });
  } catch (error) {
    console.error("Error in createProfile:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create creator profile",
    });
  }
};

/**
 * Get creator profile by ID
 * GET /api/creator-profiles/:creatorId
 */
export const getProfile = async (req, res) => {
  try {
    const { creatorId } = req.params;

    if (!creatorId) {
      return res.status(400).json({
        success: false,
        error: "Creator ID is required",
      });
    }

    const profile = await creatorProfileService.getProfile(creatorId);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error in getProfile:", error);

    if (error.message === "Creator profile not found") {
      return res.status(404).json({
        success: false,
        error: "Creator profile not found",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to get creator profile",
    });
  }
};

/**
 * Get creator profile for authenticated user
 * GET /api/creator-profiles/me
 */
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.userId || req.user?.userId; // From auth middleware

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: missing user context",
      });
    }

    const profile = await creatorProfileService.getProfileByUserId(userId);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error in getMyProfile:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Creator profile not found for this user",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to get creator profile",
    });
  }
};

/**
 * Update creator profile
 * PUT /api/creator-profiles/:creatorId
 */
export const updateProfile = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const updateData = req.body;

    console.log("🎯 [CONTROLLER] updateProfile called");
    console.log("📝 [CONTROLLER] creatorId:", creatorId);
    console.log(
      "📨 [CONTROLLER] updateData competitors:",
      updateData?.competitors,
    );
    console.log("📨 [CONTROLLER] updateData platforms:", updateData?.platforms);
    console.log(
      "📊 [CONTROLLER] updateData keys:",
      Object.keys(updateData || {}),
    );

    if (!creatorId) {
      return res.status(400).json({
        success: false,
        error: "Creator ID is required",
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Update data is required",
      });
    }

    const updated = await creatorProfileService.updateProfile(
      creatorId,
      updateData,
    );

    res.status(200).json({
      success: true,
      data: updated,
      message: "Creator profile updated successfully",
    });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update creator profile",
    });
  }
};

/**
 * Add competitor to profile
 * POST /api/creator-profiles/:creatorId/competitors
 */
export const addCompetitor = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { competitorId, name, url, notes } = req.body;

    if (!creatorId) {
      return res.status(400).json({
        success: false,
        error: "Creator ID is required",
      });
    }

    if (!competitorId || !name) {
      return res.status(400).json({
        success: false,
        error: "Competitor ID and name are required",
      });
    }

    const updated = await creatorProfileService.addCompetitor(creatorId, {
      competitorId,
      name,
      url,
      notes,
    });

    res.status(201).json({
      success: true,
      data: updated,
      message: "Competitor added successfully",
    });
  } catch (error) {
    console.error("Error in addCompetitor:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to add competitor",
    });
  }
};

/**
 * Remove competitor from profile
 * DELETE /api/creator-profiles/:creatorId/competitors/:competitorId
 */
export const removeCompetitor = async (req, res) => {
  try {
    const { creatorId, competitorId } = req.params;

    if (!creatorId || !competitorId) {
      return res.status(400).json({
        success: false,
        error: "Creator ID and competitor ID are required",
      });
    }

    const updated = await creatorProfileService.removeCompetitor(
      creatorId,
      competitorId,
    );

    res.status(200).json({
      success: true,
      data: updated,
      message: "Competitor removed successfully",
    });
  } catch (error) {
    console.error("Error in removeCompetitor:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to remove competitor",
    });
  }
};

/**
 * Update platforms
 * PATCH /api/creator-profiles/:creatorId/platforms
 */
export const updatePlatforms = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { platforms } = req.body;

    if (!creatorId) {
      return res.status(400).json({
        success: false,
        error: "Creator ID is required",
      });
    }

    if (!platforms || !Array.isArray(platforms)) {
      return res.status(400).json({
        success: false,
        error: "Platforms array is required",
      });
    }

    const updated = await creatorProfileService.updatePlatforms(
      creatorId,
      platforms,
    );

    res.status(200).json({
      success: true,
      data: updated,
      message: "Platforms updated successfully",
    });
  } catch (error) {
    console.error("Error in updatePlatforms:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update platforms",
    });
  }
};

/**
 * Complete onboarding
 * PATCH /api/creator-profiles/:creatorId/complete-onboarding
 */
export const completeOnboarding = async (req, res) => {
  try {
    const { creatorId } = req.params;

    if (!creatorId) {
      return res.status(400).json({
        success: false,
        error: "Creator ID is required",
      });
    }

    const updated = await creatorProfileService.completeOnboarding(creatorId);

    res.status(200).json({
      success: true,
      data: updated,
      message: "Onboarding completed successfully",
    });
  } catch (error) {
    console.error("Error in completeOnboarding:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to complete onboarding",
    });
  }
};

/**
 * Delete creator profile
 * DELETE /api/creator-profiles/:creatorId
 */
export const deleteProfile = async (req, res) => {
  try {
    const { creatorId } = req.params;

    if (!creatorId) {
      return res.status(400).json({
        success: false,
        error: "Creator ID is required",
      });
    }

    await creatorProfileService.deleteProfile(creatorId);

    res.status(200).json({
      success: true,
      message: "Creator profile deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteProfile:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete creator profile",
    });
  }
};

/**
 * Get profiles by status
 * GET /api/creator-profiles/status/:status
 */
export const getProfilesByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required",
      });
    }

    const profiles = await creatorProfileService.getProfilesByStatus(status);

    res.status(200).json({
      success: true,
      data: profiles,
      count: profiles.length,
    });
  } catch (error) {
    console.error("Error in getProfilesByStatus:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get profiles by status",
    });
  }
};

/**
 * Get profiles by niche
 * GET /api/creator-profiles/niche/:primaryNiche
 */
export const getProfilesByNiche = async (req, res) => {
  try {
    const { primaryNiche } = req.params;

    if (!primaryNiche) {
      return res.status(400).json({
        success: false,
        error: "Primary niche is required",
      });
    }

    const profiles =
      await creatorProfileService.getProfilesByNiche(primaryNiche);

    res.status(200).json({
      success: true,
      data: profiles,
      count: profiles.length,
    });
  } catch (error) {
    console.error("Error in getProfilesByNiche:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get profiles by niche",
    });
  }
};

/**
 * Test endpoint to get all users and creator profiles
 * GET /api/test/all-data
 */
export const getAllUsersAndProfiles = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        error: "Test route is disabled in production",
      });
    }

    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(parsedLimit) ? null : parsedLimit;

    const data = await creatorProfileService.getAllUsersAndProfiles(limit);

    res.status(200).json({
      success: true,
      message: "Fetched all users and creator profiles",
      ...data,
    });
  } catch (error) {
    console.error("Error in getAllUsersAndProfiles:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch all users and creator profiles",
    });
  }
};
