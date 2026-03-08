/**
 * ContentIdea Model
 * Defines the ContentIdea schema and structure for DynamoDB
 * Used in Phase 1: Ideation & Research
 */

/**
 * ContentIdea Schema Definition
 * @typedef {Object} ContentIdea
 * @property {string} ideaId - Unique idea identifier (UUID, sort key)
 * @property {string} userId - User who created the idea (partition key)
 * @property {string} topic - Main topic/title of the content idea
 * @property {string} angle - Unique angle or approach
 * @property {string} platform - Target platform (youtube, instagram, tiktok, linkedin)
 * @property {string} contentType - Content format (post, video, carousel, story, reel, etc)
 * @property {string} targetAudience - Description of target audience
 * @property {string} hookIdea - Opening hook suggestion
 * @property {Array<string>} keyPoints - Main points to cover in content
 * @property {Scores} scores - Evaluation scores
 * @property {Research} research - Research data (pain points, competitors)
 * @property {string} status - Idea status ('draft', 'approved', 'in-progress', 'completed')
 * @property {string} createdAt - ISO 8601 timestamp of creation
 * @property {string|null} updatedAt - ISO 8601 timestamp of last update
 */

/**
 * Scores Schema
 * @typedef {Object} Scores
 * @property {number} virality - Viral potential score (0-10)
 * @property {number} clarity - Clarity and focus score (0-10)
 * @property {number} competition - Competition level (0-10, lower is better)
 * @property {number} overall - Overall weighted score (0-10)
 */

/**
 * Research Schema
 * @typedef {Object} Research
 * @property {Array<string>} audiencePainPoints - Key audience pain points
 * @property {Array<string>} competitorPatterns - Common competitor approaches
 * @property {string|null} recommendedStructure - Suggested content structure
 * @property {Array<string>} keyInsights - Additional research insights
 */

class ContentIdea {
  /**
   * Create a new ContentIdea instance
   * @param {Object} data - Content idea data
   */
  constructor(data) {
    this.ideaId = data.ideaId;
    this.userId = data.userId;
    this.topic = data.topic;
    this.angle = data.angle;
    this.platform = data.platform;
    this.contentType = data.contentType || "post";
    this.targetAudience = data.targetAudience;
    this.hookIdea = data.hookIdea || "";
    this.keyPoints = data.keyPoints || [];
    this.scores = data.scores || {
      virality: 0,
      clarity: 0,
      competition: 0,
      overall: 0,
    };
    this.research = data.research || {
      audiencePainPoints: [],
      competitorPatterns: [],
      recommendedStructure: null,
      keyInsights: [],
    };
    this.status = data.status || "draft";
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || null;
  }

  /**
   * Validate required fields
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!this.ideaId) errors.push("ideaId is required");
    if (!this.userId) errors.push("userId is required");
    if (!this.topic) errors.push("topic is required");
    if (!this.angle) errors.push("angle is required");
    if (!this.platform) errors.push("platform is required");

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert to DynamoDB item format
   * @returns {Object} DynamoDB item
   */
  toDynamoItem() {
    return {
      ideaId: this.ideaId,
      userId: this.userId,
      topic: this.topic,
      angle: this.angle,
      platform: this.platform,
      contentType: this.contentType,
      targetAudience: this.targetAudience,
      hookIdea: this.hookIdea,
      keyPoints: this.keyPoints,
      scores: this.scores,
      research: this.research,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create ContentIdea from DynamoDB item
   * @param {Object} item - DynamoDB item
   * @returns {ContentIdea} ContentIdea instance
   */
  static fromDynamoItem(item) {
    return new ContentIdea(item);
  }

  /**
   * Get array of valid platforms
   * @returns {Array<string>} Valid platform values
   */
  static getValidPlatforms() {
    return ["youtube", "instagram", "tiktok", "linkedin", "twitter", "facebook"];
  }

  /**
   * Get array of valid statuses
   * @returns {Array<string>} Valid status values
   */
  static getValidStatuses() {
    return ["draft", "approved", "in-progress", "completed", "archived"];
  }

  /**
   * Calculate overall score from individual scores
   * Formula: 0.4 * virality + 0.3 * audienceRelevance + 0.2 * clarity + 0.1 * (10 - competition)
   * @param {number} virality - Virality score (0-10)
   * @param {number} audienceRelevance - Audience relevance score (0-10)
   * @param {number} clarity - Clarity score (0-10)
   * @param {number} competition - Competition level (0-10)
   * @returns {number} Overall score (0-10)
   */
  static calculateOverallScore(virality, audienceRelevance, clarity, competition) {
    return parseFloat(
      (0.4 * virality + 0.3 * audienceRelevance + 0.2 * clarity + 0.1 * (10 - competition)).toFixed(1)
    );
  }
}

export default ContentIdea;
