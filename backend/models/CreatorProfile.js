/**
 * CreatorProfile Model
 * Defines the CreatorProfile schema for content creators/influencers
 * Links to User model via userId
 */

/**
 * CreatorProfile Schema Definition
 * @typedef {Object} CreatorProfile
 * @property {string} creatorId - Unique creator profile identifier (UUID)
 * @property {string} userId - Link to User (foreign key)
 * @property {Object} niche - Primary and secondary content niches
 * @property {string} niche.primary - Primary niche (e.g., "tech", "fitness")
 * @property {string} niche.secondary - Secondary niche
 * @property {Array} platforms - Social media platforms
 * @property {Object} goals - Creator goals and level
 * @property {string} goals.primaryGoal - Primary goal (growth, monetization, engagement)
 * @property {string} goals.creatorLevel - Level (beginner, intermediate, advanced)
 * @property {Object} strategy - Content strategy
 * @property {string} strategy.contentStrategy - Strategy type (educational, entertainment, promotional)
 * @property {string} strategy.postingFrequency - Posts per week (e.g., "3/week")
 * @property {Array<string>} strategy.contentPillars - Main content themes
 * @property {Object} preferences - Tone and format preferences
 * @property {Array<string>} preferences.tones - Tone style (professional, casual, funny)
 * @property {Array<string>} preferences.formats - Content format (carousel, reel, static)
 * @property {Object} preferences.constraints - Content constraints
 * @property {boolean} preferences.constraints.emojiUsage - Use emojis
 * @property {string} preferences.constraints.ctaStrength - CTA intensity (weak, medium, strong)
 * @property {string} preferences.constraints.formality - Formality level (formal, semi-formal, casual)
 * @property {string} preferences.timeCommitment - Time commitment (low, medium, high)
 * @property {Array} competitors - Competitor tracking
 * @property {Object} settings - Profile settings
 * @property {boolean} settings.onboardingCompleted - Onboarding status
 * @property {string} createdAt - ISO 8601 timestamp
 * @property {string} updatedAt - ISO 8601 timestamp
 * @property {string} status - Profile status (active, inactive, suspended)
 */

class CreatorProfile {
  /**
   * Create a new CreatorProfile instance
   * @param {Object} data - Profile data
   */
  constructor(data) {
    this.creatorId = data.creatorId;
    this.userId = data.userId;
    this.niche = data.niche;
    this.platforms = data.platforms || [];
    this.goals = data.goals;
    this.strategy = data.strategy;
    this.preferences = data.preferences;
    this.competitors = data.competitors || [];
    this.settings = data.settings || { onboardingCompleted: false };
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.status = data.status || "active";
  }

  /**
   * Create a new creator profile object with default values
   * @param {string} creatorId - Creator profile ID (UUID)
   * @param {string} userId - User ID (link to User model)
   * @param {Object} profileData - Creator profile data
   * @returns {Object} Creator profile object ready for database
   */
  static create(creatorId, userId, profileData) {
    const now = new Date().toISOString();

    return {
      creatorId,
      userId,
      niche: {
        primary: profileData.niche?.primary || "unspecified",
        secondary: profileData.niche?.secondary || null,
      },
      platforms: profileData.platforms || [],
      goals: {
        primaryGoal: profileData.goals?.primaryGoal || "growth",
        creatorLevel: profileData.goals?.creatorLevel || "beginner",
      },
      strategy: {
        contentStrategy: profileData.strategy?.contentStrategy || "educational",
        postingFrequency: profileData.strategy?.postingFrequency || "1/week",
        contentPillars: profileData.strategy?.contentPillars || [],
      },
      preferences: {
        tones: profileData.preferences?.tones || ["professional"],
        formats: profileData.preferences?.formats || ["static"],
        constraints: {
          emojiUsage: profileData.preferences?.constraints?.emojiUsage ?? true,
          ctaStrength:
            profileData.preferences?.constraints?.ctaStrength || "medium",
          formality:
            profileData.preferences?.constraints?.formality || "semi-formal",
        },
        timeCommitment: profileData.preferences?.timeCommitment || "medium",
      },
      competitors: profileData.competitors || [],
      settings: {
        onboardingCompleted: profileData.settings?.onboardingCompleted ?? false,
      },
      createdAt: now,
      updatedAt: now,
      status: "active",
    };
  }

  /**
   * Validate creator profile data
   * @param {Object} data - Profile data to validate
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validate(data) {
    const errors = [];

    // Validate userId
    if (!data.userId || typeof data.userId !== "string") {
      errors.push("userId is required and must be a string");
    }

    // Validate niche
    if (
      !data.niche ||
      !data.niche.primary ||
      typeof data.niche.primary !== "string"
    ) {
      errors.push("Primary niche is required");
    }

    // Validate goals
    if (!data.goals || !data.goals.primaryGoal) {
      errors.push("Primary goal is required");
    }

    if (
      data.goals &&
      !["growth", "monetization", "engagement", "brand-building"].includes(
        data.goals.primaryGoal,
      )
    ) {
      errors.push("Invalid primary goal");
    }

    if (
      data.goals &&
      !["beginner", "intermediate", "advanced"].includes(
        data.goals.creatorLevel,
      )
    ) {
      errors.push("Invalid creator level");
    }

    // Validate strategy
    if (!data.strategy || !data.strategy.contentStrategy) {
      errors.push("Content strategy is required");
    }

    if (data.strategy && !Array.isArray(data.strategy.contentPillars)) {
      errors.push("Content pillars must be an array");
    }

    // Validate platforms
    if (data.platforms && !Array.isArray(data.platforms)) {
      errors.push("Platforms must be an array");
    }

    // Validate preferences
    if (data.preferences && data.preferences.constraints) {
      const { ctaStrength, formality } = data.preferences.constraints;

      if (!["weak", "medium", "strong"].includes(ctaStrength)) {
        errors.push("CTA strength must be weak, medium, or strong");
      }

      if (!["formal", "semi-formal", "casual"].includes(formality)) {
        errors.push("Formality must be formal, semi-formal, or casual");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Add a competitor to track
   * @param {Object} competitor - Competitor data
   */
  addCompetitor(competitor) {
    if (!competitor.competitorId || !competitor.name) {
      throw new Error("Competitor ID and name are required");
    }

    this.competitors.push({
      competitorId: competitor.competitorId,
      name: competitor.name,
      url: competitor.url || null,
      notes: competitor.notes || null,
      addedAt: new Date().toISOString(),
    });

    this.updatedAt = new Date().toISOString();
  }

  /**
   * Remove a competitor
   * @param {string} competitorId - Competitor ID to remove
   */
  removeCompetitor(competitorId) {
    this.competitors = this.competitors.filter(
      (c) => c.competitorId !== competitorId,
    );
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Update platforms
   * @param {Array} platforms - Updated platforms array
   */
  updatePlatforms(platforms) {
    if (!Array.isArray(platforms)) {
      throw new Error("Platforms must be an array");
    }
    this.platforms = platforms;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Update strategy
   * @param {Object} strategyUpdate - Strategy fields to update
   */
  updateStrategy(strategyUpdate) {
    this.strategy = { ...this.strategy, ...strategyUpdate };
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Update preferences
   * @param {Object} preferencesUpdate - Preferences to update
   */
  updatePreferences(preferencesUpdate) {
    this.preferences = {
      ...this.preferences,
      ...preferencesUpdate,
      constraints: {
        ...this.preferences.constraints,
        ...(preferencesUpdate.constraints || {}),
      },
    };
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Complete onboarding
   */
  completeOnboarding() {
    this.settings.onboardingCompleted = true;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get public profile data (safe to send to client)
   * @returns {Object} Public profile data
   */
  toPublic() {
    return {
      creatorId: this.creatorId,
      userId: this.userId,
      niche: this.niche,
      platforms: this.platforms,
      goals: this.goals,
      strategy: this.strategy,
      preferences: this.preferences,
      competitors: this.competitors,
      settings: this.settings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Get profile data for database storage
   * @returns {Object} Full profile object
   */
  toDatabase() {
    return {
      creatorId: this.creatorId,
      userId: this.userId,
      niche: this.niche,
      platforms: this.platforms,
      goals: this.goals,
      strategy: this.strategy,
      preferences: this.preferences,
      competitors: this.competitors,
      settings: this.settings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      status: this.status,
    };
  }
}

export default CreatorProfile;
