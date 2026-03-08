import { v4 as uuidv4 } from "uuid";
import {
  generateOutline,
  generateDraft,
  generateAllPlatformVariants,
  generateScriptsForPlatforms,
} from "../services/contentGenerationService.js";
import {
  saveContent,
  getContentById,
  getUserContent,
  updateDistributionStatus,
  updatePlatformVariant,
} from "../services/ddbContentService.js";
import { getIdeaById } from "../services/ddbIdeationService.js";
import creatorProfileService from "../services/creatorProfile.service.js";

function resolveAuthenticatedUserId(req, res, payloadUserId) {
  const authenticatedUserId = req.userId;

  if (!authenticatedUserId) {
    res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
    return null;
  }

  if (payloadUserId && payloadUserId !== authenticatedUserId) {
    res.status(403).json({
      success: false,
      error: "userId does not match authenticated user",
    });
    return null;
  }

  return authenticatedUserId;
}

/**
 * Normalize input from Phase 1 or manual entry
 */
function normalizeContentInput(input) {
  const mapPlatform = (platform) => {
    const normalized = String(platform || "").toLowerCase();
    if (normalized === "blog") return "medium";
    if (normalized === "x") return "twitter";
    return normalized;
  };

  const rawPlatforms = Array.isArray(input.platforms)
    ? input.platforms
    : input.platform
    ? [input.platform]
    : ["linkedin"];

  const normalizedPlatforms = [
    ...new Set(rawPlatforms.map(mapPlatform).filter(Boolean)),
  ];

  // Handle both Phase 1 ideas and manual input
  return {
    source: input.source || (input.ideaId ? "phase1" : "manual"),
    ideaId: input.ideaId || null,
    topic: input.topic,
    angle: input.angle || null,
    targetAudience: input.targetAudience || "general audience",
    goal: input.goal || "engagement",
    contentType: input.contentType || "post",
    platforms: normalizedPlatforms,
    hookIdea: input.hookIdea || null,
    keyPoints: input.keyPoints || [],
    preferences: {
      tone: input.preferences?.tone || input.tone || "professional",
      length: input.preferences?.length || input.length || "medium",
      includeCTA: input.preferences?.includeCTA !== false,
    },
  };
}

/**
 * Create content from Phase 1 idea
 * POST /api/content/from-idea
 */
async function createFromIdeaHandler(req, res) {
  try {
    const {
      userId: payloadUserId,
      ideaId,
      ideaUserId,
      platforms,
      preferences,
      contentType,
      goal,
    } = req.body;
    const userId = resolveAuthenticatedUserId(req, res, payloadUserId);
    if (!userId) return;

    if (!ideaId) {
      return res.status(400).json({
        success: false,
        error: "ideaId is required",
      });
    }

    // Fetch the original idea from Phase 1.
    // ideaUserId allows lookup from owner while saving output under current user.
    const ideaLookupUserId = ideaUserId || userId;
    const idea = await getIdeaById(ideaLookupUserId, ideaId);
    if (!idea) {
      return res.status(404).json({
        success: false,
        error: "Idea not found",
      });
    }

    // Normalize the idea into content input format
    const contentInput = normalizeContentInput({
      source: "phase1",
      ideaId: idea.ideaId,
      topic: idea.topic,
      angle: idea.angle,
      targetAudience: idea.targetAudience || "general audience",
      platforms:
        Array.isArray(platforms) && platforms.length > 0
          ? platforms
          : idea.platform
          ? [idea.platform]
          : ["linkedin"],
      contentType: contentType || idea.contentType || "post",
      goal: goal || idea.goal || "engagement",
      hookIdea: idea.hook,
      keyPoints: idea.keyPoints || [],
      preferences,
    });

    // Generate content package
    const contentPackage = await generateCompleteContent(userId, contentInput);

    res.json({
      success: true,
      content: contentPackage,
    });
  } catch (error) {
    console.error("Error creating content from idea:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Create content from manual input
 * POST /api/content/from-manual
 */
async function createFromManualHandler(req, res) {
  try {
    const { userId: payloadUserId, ...manualInput } = req.body;
    const userId = resolveAuthenticatedUserId(req, res, payloadUserId);
    if (!userId) return;

    if (!manualInput.topic) {
      return res.status(400).json({
        success: false,
        error: "topic is required",
      });
    }

    // Normalize manual input
    const contentInput = normalizeContentInput({
      ...manualInput,
      source: "manual",
    });

    // Generate content package
    const contentPackage = await generateCompleteContent(userId, contentInput);

    res.json({
      success: true,
      content: contentPackage,
    });
  } catch (error) {
    console.error("Error creating content from manual input:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Core function to generate complete content package
 */
async function generateCompleteContent(userId, contentInput) {
  const contentId = uuidv4();

  // Fetch creator profile for context
  let creatorProfile = null;
  try {
    creatorProfile = await creatorProfileService.getProfileByUserId(userId);
  } catch (error) {
    // No creator profile found, continuing without profile context
  }

  // Step 1: Generate outline
  const outline = await generateOutline(contentInput, creatorProfile);

  // Step 2: Generate draft content
  const draft = await generateDraft(contentInput, outline, creatorProfile);

  // Step 3: Generate platform variants
  const platformVariants = await generateAllPlatformVariants(
    draft,
    outline,
    contentInput,
    contentInput.platforms
  );

  // Step 4: Generate video scripts (only for video platforms)
  const scripts = await generateScriptsForPlatforms(
    outline,
    contentInput,
    contentInput.platforms
  );

  // Step 5: Create complete content package
  const contentPackage = {
    contentId,
    userId,
    source: contentInput.source,
    ideaId: contentInput.ideaId,
    topic: contentInput.topic,
    angle: contentInput.angle,
    targetAudience: contentInput.targetAudience,
    goal: contentInput.goal,
    contentType: contentInput.contentType,
    outline,
    draft,
    platformVariants,
    scripts: Object.keys(scripts).length > 0 ? scripts : undefined,
    distribution: {
      status: "draft",
      platformTargets: contentInput.platforms,
      scheduledAt: null,
    },
    analytics: {
      likes: 0,
      comments: 0,
      shares: 0,
    },
  };

  // Step 6: Save to DynamoDB
  await saveContent(contentPackage);

  return contentPackage;
}

/**
 * Get specific content by ID
 * GET /api/content/:contentId
 */
async function getContentHandler(req, res) {
  try {
    const { contentId } = req.params;
    const userId = resolveAuthenticatedUserId(req, res, req.query.userId);
    if (!userId) return;

    const content = await getContentById(userId, contentId);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: "Content not found",
      });
    }

    res.json({
      success: true,
      content,
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get all content for a user
 * GET /api/content/user
 */
async function getUserContentHandler(req, res) {
  try {
    const userId = resolveAuthenticatedUserId(req, res, req.query.userId);
    if (!userId) return;

    const contentList = await getUserContent(userId);

    res.json({
      success: true,
      count: contentList.length,
      content: contentList,
    });
  } catch (error) {
    console.error("Error fetching user content:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Generate only outline (for preview/refinement)
 * POST /api/content/generate-outline
 */
async function generateOutlineHandler(req, res) {
  try {
    const contentInput = normalizeContentInput(req.body);

    if (!contentInput.topic) {
      return res.status(400).json({
        success: false,
        error: "topic is required",
      });
    }

    const outline = await generateOutline(contentInput);

    res.json({
      success: true,
      outline,
    });
  } catch (error) {
    console.error("Error generating outline:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Generate only draft (for preview/refinement)
 * POST /api/content/generate-draft
 */
async function generateDraftHandler(req, res) {
  try {
    const { outline, ...inputData } = req.body;

    if (!outline) {
      return res.status(400).json({
        success: false,
        error: "outline is required",
      });
    }

    const contentInput = normalizeContentInput(inputData);
    const draft = await generateDraft(contentInput, outline);

    res.json({
      success: true,
      draft,
    });
  } catch (error) {
    console.error("Error generating draft:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Regenerate variant for a specific platform
 * POST /api/content/regenerate-variant
 */
async function regenerateVariantHandler(req, res) {
  try {
    const { userId: payloadUserId, contentId, platform } = req.body;
    const userId = resolveAuthenticatedUserId(req, res, payloadUserId);
    if (!userId) return;

    if (!contentId || !platform) {
      return res.status(400).json({
        success: false,
        error: "contentId and platform are required",
      });
    }

    // Fetch existing content
    const content = await getContentById(userId, contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        error: "Content not found",
      });
    }

    // Regenerate variant for the specified platform
    const { generateLinkedInVariant, generateTwitterVariant, generateInstagramVariant, generateRedditVariant, generateYouTubeVariant, generateMediumVariant } = await import("../services/contentGenerationService.js");

    let newVariant;
    switch (platform.toLowerCase()) {
      case "linkedin":
        newVariant = await generateLinkedInVariant(content.draft, content.outline, content);
        break;
      case "twitter":
        newVariant = await generateTwitterVariant(content.draft, content.outline, content);
        break;
      case "instagram":
        newVariant = await generateInstagramVariant(content.draft, content.outline, content);
        break;
      case "reddit":
        newVariant = await generateRedditVariant(content.draft, content.outline, content);
        break;
      case "youtube":
        newVariant = await generateYouTubeVariant(content.draft, content.outline, content);
        break;
      case "medium":
        newVariant = await generateMediumVariant(content.draft, content.outline, content);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Platform ${platform} not supported`,
        });
    }

    // Update in database
    const updatedContent = await updatePlatformVariant(userId, contentId, platform.toLowerCase(), newVariant);

    res.json({
      success: true,
      variant: newVariant,
      content: updatedContent,
    });
  } catch (error) {
    console.error("Error regenerating variant:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Update distribution status
 * POST /api/content/update-status
 */
async function updateStatusHandler(req, res) {
  try {
    const { userId: payloadUserId, contentId, status, scheduledAt } = req.body;
    const userId = resolveAuthenticatedUserId(req, res, payloadUserId);
    if (!userId) return;

    if (!contentId || !status) {
      return res.status(400).json({
        success: false,
        error: "contentId and status are required",
      });
    }

    const validStatuses = ["draft", "scheduled", "published"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const updatedContent = await updateDistributionStatus(
      userId,
      contentId,
      status,
      scheduledAt
    );

    res.json({
      success: true,
      content: updatedContent,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export {
  createFromIdeaHandler,
  createFromManualHandler,
  getContentHandler,
  getUserContentHandler,
  generateOutlineHandler,
  generateDraftHandler,
  regenerateVariantHandler,
  updateStatusHandler,
};
