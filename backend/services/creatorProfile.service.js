/**
 * Creator Profile Service
 * Business logic for creator profile management
 * Integrates CreatorProfile model with DynamoDB operations
 */

import CreatorProfile from "../models/CreatorProfile.js";
import dynamodb from "./dynamodb.service.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Creator Profile Service
 */
const creatorProfileService = {
  /**
   * Create a new creator profile for a user
   * @param {string} userId - User ID
   * @param {Object} profileData - Creator profile data
   * @returns {Promise<Object>} Created profile
   */
  async createProfile(userId, profileData) {
    // Step 1: Validate data using model validation
    console.log("📝 Creating profile for user:", userId);
    console.log(
      "📦 Profile data received - competitors field:",
      profileData.competitors,
    );
    console.log(
      "📦 Profile data received - competitors type:",
      typeof profileData.competitors,
    );
    console.log(
      "📦 Profile data received - competitors is array?",
      Array.isArray(profileData.competitors),
    );
    console.log(
      "📦 Profile data received - competitors length:",
      profileData.competitors?.length,
    );

    const validation = CreatorProfile.validate({
      userId,
      niche: profileData.niche,
      targetAudience: profileData.targetAudience,
      goals: profileData.goals,
      strategy: profileData.strategy,
      platforms: profileData.platforms,
      preferences: profileData.preferences,
      competitors: profileData.competitors,
    });

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Step 2: Create profile object using model factory
    const creatorId = `creator_${uuidv4()}`;
    const profileObject = CreatorProfile.create(creatorId, userId, profileData);

    console.log(
      "✅ Profile object created - competitors field:",
      profileObject.competitors,
    );
    console.log(
      "✅ Profile object created - competitors type:",
      typeof profileObject.competitors,
    );
    console.log(
      "✅ Profile object created - competitors length:",
      profileObject.competitors?.length,
    );
    console.log("✅ Full profileObject keys:", Object.keys(profileObject));

    // Step 3: Save to database
    try {
      const savedProfile = await dynamodb.createCreatorProfile(profileObject);
      console.log(`Creator profile created: ${creatorId} for user: ${userId}`);
      console.log(
        "💾 Saved profile - competitors field:",
        savedProfile.competitors,
      );
      console.log(
        "💾 Saved profile - competitors length:",
        savedProfile.competitors?.length,
      );
      return savedProfile;
    } catch (error) {
      console.error("Failed to create creator profile:", error);
      throw error;
    }
  },

  /**
   * Get creator profile by ID
   * @param {string} creatorId - Creator profile ID
   * @returns {Promise<Object>} Creator profile
   */
  async getProfile(creatorId) {
    if (!creatorId) {
      throw new Error("Creator ID is required");
    }

    try {
      const profile = await dynamodb.getCreatorProfile(creatorId);
      if (!profile) {
        throw new Error("Creator profile not found");
      }
      return profile;
    } catch (error) {
      console.error("Failed to get creator profile:", error);
      throw error;
    }
  },

  /**
   * Get creator profile by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Creator profile
   */
  async getProfileByUserId(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      const profile = await dynamodb.getCreatorProfileByUserId(userId);
      if (!profile) {
        throw new Error("Creator profile not found for this user");
      }
      return profile;
    } catch (error) {
      console.error("Failed to get creator profile by user ID:", error);
      throw error;
    }
  },

  /**
   * Update creator profile
   * @param {string} creatorId - Creator profile ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(creatorId, updateData) {
    if (!creatorId) {
      throw new Error("Creator ID is required");
    }

    console.log("📝 [SERVICE] updateProfile called");
    console.log("📝 [SERVICE] creatorId:", creatorId);
    console.log("📋 [SERVICE] updateData.competitors:", updateData.competitors);
    console.log("📋 [SERVICE] updateData.platforms:", updateData.platforms);
    console.log("📋 [SERVICE] updateData keys:", Object.keys(updateData));

    // Validate if certain fields are being updated
    if (
      updateData.niche ||
      updateData.targetAudience !== undefined ||
      updateData.goals ||
      updateData.strategy ||
      updateData.platforms ||
      updateData.preferences
    ) {
      const validation = CreatorProfile.validate({
        userId: "temp", // Just for validation, userId won't be updated
        niche: updateData.niche,
        targetAudience: updateData.targetAudience,
        goals: updateData.goals,
        strategy: updateData.strategy,
        platforms: updateData.platforms,
        preferences: updateData.preferences,
      });

      // Filter out validation errors for fields that aren't being updated
      const relevantErrors = validation.errors.filter((error) => {
        if (!updateData.niche && error.includes("niche")) return false;
        if (
          updateData.targetAudience === undefined &&
          error.includes("Target audience")
        )
          return false;
        if (!updateData.goals && error.includes("goal")) return false;
        if (!updateData.strategy && error.includes("strategy")) return false;
        if (!updateData.platforms && error.includes("platform")) return false;
        if (!updateData.preferences && error.includes("preference"))
          return false;
        return true;
      });

      if (relevantErrors.length > 0) {
        throw new Error(`Validation failed: ${relevantErrors.join(", ")}`);
      }
    }

    try {
      const dataToSave = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      console.log(
        "💾 [SERVICE] dataToSave.competitors:",
        dataToSave.competitors,
      );
      console.log("💾 [SERVICE] dataToSave.platforms:", dataToSave.platforms);

      const updated = await dynamodb.updateCreatorProfile(
        creatorId,
        dataToSave,
      );
      console.log(`Creator profile updated: ${creatorId}`);
      console.log("✅ [SERVICE] Updated competitors:", updated.competitors);
      console.log("✅ [SERVICE] Updated platforms:", updated.platforms);
      return updated;
    } catch (error) {
      console.error("Failed to update creator profile:", error);
      throw error;
    }
  },

  /**
   * Add competitor to profile
   * @param {string} creatorId - Creator profile ID
   * @param {Object} competitor - Competitor data
   * @returns {Promise<Object>} Updated profile
   */
  async addCompetitor(creatorId, competitor) {
    if (!creatorId || !competitor.competitorId || !competitor.name) {
      throw new Error("Creator ID, competitor ID, and name are required");
    }

    try {
      const profile = await dynamodb.getCreatorProfile(creatorId);
      if (!profile) {
        throw new Error("Creator profile not found");
      }

      const competitors = profile.competitors || [];
      const newCompetitor = {
        competitorId: competitor.competitorId,
        name: competitor.name,
        url: competitor.url || null,
        notes: competitor.notes || null,
        addedAt: new Date().toISOString(),
      };

      competitors.push(newCompetitor);

      const updated = await dynamodb.updateCreatorProfile(creatorId, {
        competitors,
        updatedAt: new Date().toISOString(),
      });

      console.log(`Competitor added to profile: ${creatorId}`);
      return updated;
    } catch (error) {
      console.error("Failed to add competitor:", error);
      throw error;
    }
  },

  /**
   * Remove competitor from profile
   * @param {string} creatorId - Creator profile ID
   * @param {string} competitorId - Competitor ID to remove
   * @returns {Promise<Object>} Updated profile
   */
  async removeCompetitor(creatorId, competitorId) {
    if (!creatorId || !competitorId) {
      throw new Error("Creator ID and competitor ID are required");
    }

    try {
      const profile = await dynamodb.getCreatorProfile(creatorId);
      if (!profile) {
        throw new Error("Creator profile not found");
      }

      const competitors = (profile.competitors || []).filter(
        (c) => c.competitorId !== competitorId,
      );

      const updated = await dynamodb.updateCreatorProfile(creatorId, {
        competitors,
        updatedAt: new Date().toISOString(),
      });

      console.log(`Competitor removed from profile: ${creatorId}`);
      return updated;
    } catch (error) {
      console.error("Failed to remove competitor:", error);
      throw error;
    }
  },

  /**
   * Update platforms
   * @param {string} creatorId - Creator profile ID
   * @param {Array} platforms - Updated platforms
   * @returns {Promise<Object>} Updated profile
   */
  async updatePlatforms(creatorId, platforms) {
    if (!creatorId || !Array.isArray(platforms)) {
      throw new Error("Creator ID and platforms array are required");
    }

    try {
      const updated = await dynamodb.updateCreatorProfile(creatorId, {
        platforms,
        updatedAt: new Date().toISOString(),
      });
      console.log(`Platforms updated for profile: ${creatorId}`);
      return updated;
    } catch (error) {
      console.error("Failed to update platforms:", error);
      throw error;
    }
  },

  /**
   * Complete onboarding
   * @param {string} creatorId - Creator profile ID
   * @returns {Promise<Object>} Updated profile
   */
  async completeOnboarding(creatorId) {
    if (!creatorId) {
      throw new Error("Creator ID is required");
    }

    try {
      const updated = await dynamodb.updateCreatorProfile(creatorId, {
        "settings.onboardingCompleted": true,
        updatedAt: new Date().toISOString(),
      });
      console.log(`Onboarding completed for profile: ${creatorId}`);
      return updated;
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      throw error;
    }
  },

  /**
   * Delete creator profile
   * @param {string} creatorId - Creator profile ID
   * @returns {Promise<void>}
   */
  async deleteProfile(creatorId) {
    if (!creatorId) {
      throw new Error("Creator ID is required");
    }

    try {
      await dynamodb.deleteCreatorProfile(creatorId);
      console.log(`Creator profile deleted: ${creatorId}`);
    } catch (error) {
      console.error("Failed to delete creator profile:", error);
      throw error;
    }
  },

  /**
   * Get profiles by status
   * @param {string} status - Profile status (active, inactive, suspended)
   * @returns {Promise<Array>} Array of profiles
   */
  async getProfilesByStatus(status) {
    if (!status) {
      throw new Error("Status is required");
    }

    try {
      const profiles = await dynamodb.queryCreatorProfilesByStatus(status);
      console.log(
        `Retrieved ${profiles.length} profiles with status: ${status}`,
      );
      return profiles;
    } catch (error) {
      console.error("Failed to get profiles by status:", error);
      throw error;
    }
  },

  /**
   * Get profiles by niche
   * @param {string} primaryNiche - Primary niche
   * @returns {Promise<Array>} Array of profiles
   */
  async getProfilesByNiche(primaryNiche) {
    if (!primaryNiche) {
      throw new Error("Primary niche is required");
    }

    try {
      const profiles = await dynamodb.queryCreatorProfilesByNiche(primaryNiche);
      console.log(
        `Retrieved ${profiles.length} profiles with niche: ${primaryNiche}`,
      );
      return profiles;
    } catch (error) {
      console.error("Failed to get profiles by niche:", error);
      throw error;
    }
  },

  async getAllUsersAndProfiles(limit = null) {
    try {
      const users = await dynamodb.getAllUsers(limit);
      const profiles = await dynamodb.getAllCreatorProfiles(limit);

      return {
        users,
        profiles,
        usersCount: users.length,
        profilesCount: profiles.length,
      };
    } catch (error) {
      console.error("Failed to get all users and profiles:", error);
      throw error;
    }
  },
};

export default creatorProfileService;
