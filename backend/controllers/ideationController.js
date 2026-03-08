import { v4 as uuidv4 } from "uuid";
import ContentIdea from "../models/ContentIdea.js";
import creatorProfileService from "../services/creatorProfile.service.js";
import {
  generateZeroIdeas,
  refineSomeIdea,
  evaluateFullIdea,
  researchIdea,
  calculateScore,
  scoreIdeaWithLogic,
} from "../services/ideationService.js";
import { saveIdea, getIdeaById, getUserIdeas, updateIdeaResearch } from "../services/ddbIdeationService.js";

function normalizeResearchPayload(raw) {
  const data = raw && typeof raw === "object" ? raw : {};

  const normalizeArray = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item ?? "").trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split(/\n|\||,|;/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const normalizeString = (value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  };

  return {
    audiencePainPoints: normalizeArray(data.audiencePainPoints || data.audience_pain_points || data.painPoints),
    competitorPatterns: normalizeArray(data.competitorPatterns || data.competitor_patterns || data.competitors),
    recommendedStructure: normalizeString(data.recommendedStructure || data.recommended_structure || data.structure),
    keyPoints: normalizeArray(data.keyPoints || data.key_points || data.keyInsights || data.insights),
    yourAngleStrength: normalizeString(data.yourAngleStrength || data.your_angle_strength || data.angleStrength),
  };
}

async function getCreatorProfileContext(userId) {
  if (!userId) return null;

  try {
    return await creatorProfileService.getProfileByUserId(userId);
  } catch (_error) {
    // Ideation should still work if profile is not available.
    return null;
  }
}

/**
 * POST /ideation/generate
 * Zero Idea Flow - Generate ideas from user profile
 */
async function generateIdeas(req, res) {
  try {
    const { userId, niche, audience, platforms, goal } = req.body;

    if (!userId || !niche || !audience || !platforms) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, niche, audience, platforms",
      });
    }

    const creatorProfile = await getCreatorProfileContext(userId);

    const ideas = await generateZeroIdeas({
      niche,
      audience,
      platforms,
      goal,
    }, creatorProfile);

    // Score ideas using deterministic logic + Google Trends competition.
    const scoredIdeas = await Promise.all(
      ideas.map(async (idea) => {
        const logicScores = await scoreIdeaWithLogic(idea, {
          audience,
          goal: goal || creatorProfile?.goals?.primaryGoal,
          niche: niche || creatorProfile?.niche?.primary,
          fallbackKeyword: niche,
        });

        return {
          ...idea,
          platform: idea.platform || platforms?.[0] || creatorProfile?.platforms?.[0] || "youtube",
          scores: logicScores,
        };
      })
    );

    // Sort by score
    scoredIdeas.sort((a, b) => b.scores.overall - a.scores.overall);

    res.json({
      success: true,
      ideas: scoredIdeas,
      count: scoredIdeas.length,
    });
  } catch (error) {
    console.error("Generate ideas error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /ideation/refine
 * Some Idea Flow - Refine rough idea into multiple angles
 */
async function refineIdea(req, res) {
  try {
    const { userId, roughIdea, audience, platform } = req.body;

    if (!userId || !roughIdea || !audience || !platform) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, roughIdea, audience, platform",
      });
    }

    const creatorProfile = await getCreatorProfileContext(userId);

    const refinedIdeas = await refineSomeIdea(roughIdea, audience, platform, creatorProfile);

    const normalizedIdeas = (Array.isArray(refinedIdeas) ? refinedIdeas : []).map((idea, index) => ({
      title: (idea?.title || `${roughIdea} - Angle ${index + 1}`).toString().trim(),
      angle: (idea?.angle || "Unique perspective for this audience").toString().trim(),
      format: (idea?.format || "post").toString().trim(),
      hook: (idea?.hook || idea?.hookIdea || "").toString().trim(),
      platform,
    }));

    const scoredIdeas = await Promise.all(
      normalizedIdeas.map(async (idea) => {
        const logicScores = await scoreIdeaWithLogic(idea, {
          audience,
          goal: creatorProfile?.goals?.primaryGoal,
          niche: creatorProfile?.niche?.primary,
          fallbackKeyword: roughIdea,
        });

        return {
          ...idea,
          scores: logicScores,
        };
      })
    );

    scoredIdeas.sort((a, b) => b.scores.overall - a.scores.overall);

    res.json({
      success: true,
      ideas: scoredIdeas,
      count: scoredIdeas.length,
    });
  } catch (error) {
    console.error("Refine idea error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /ideation/evaluate
 * Full Idea Flow - Evaluate existing idea
 */
async function evaluateIdea(req, res) {
  try {
    const { userId, idea, audience, platform } = req.body;

    if (!userId || !idea || !audience || !platform) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, idea, audience, platform",
      });
    }

    const creatorProfile = await getCreatorProfileContext(userId);

    const evaluation = await evaluateFullIdea(idea, audience, platform, creatorProfile);

    const logicScores = await scoreIdeaWithLogic(
      {
        title: evaluation?.improvedTitle || idea,
        angle: evaluation?.suggestedHook || idea,
        format: evaluation?.format || "post",
        platform,
      },
      {
        audience,
        goal: creatorProfile?.goals?.primaryGoal,
        niche: creatorProfile?.niche?.primary,
        fallbackKeyword: idea,
      }
    );

    const result = {
      ...evaluation,
      scores: {
        virality: Number(evaluation?.viralityScore) || logicScores.virality,
        clarity: Number(evaluation?.clarityScore) || logicScores.clarity,
        competition: logicScores.competition,
      },
    };

    result.scores.overall = calculateScore(result.scores.virality, 8.5, result.scores.clarity, result.scores.competition);

    res.json({
      success: true,
      evaluation: result,
    });
  } catch (error) {
    console.error("Evaluate idea error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /ideation/research
 * Research an idea - get pain points, competitors, etc.
 */
async function researchIdeaHandler(req, res) {
  try {
    const { userId, idea, audience } = req.body;

    if (!userId || !idea || !audience) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, idea, audience",
      });
    }

    const creatorProfile = await getCreatorProfileContext(userId);
    const research = await researchIdea(idea, audience, creatorProfile);

    res.json({
      success: true,
      research,
    });
  } catch (error) {
    console.error("Research idea error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /ideation/select
 * Save selected idea as content brief
 */
async function selectIdea(req, res) {
  try {
    const { userId, topic, angle, platform, contentType, targetAudience, hookIdea, keyPoints, scores, research } = req.body;

    if (!userId || !topic || !angle || !platform) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const ideaId = uuidv4();

    // Create ContentIdea instance with validation
    const contentIdea = new ContentIdea({
      ideaId,
      userId,
      topic,
      angle,
      platform,
      contentType: contentType || "post",
      targetAudience,
      hookIdea,
      keyPoints: keyPoints || [],
      scores: scores || {},
      research: research || {},
      status: "approved",
    });

    // Validate the idea
    const validation = contentIdea.validate();
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const contentBrief = contentIdea.toDynamoItem();
    await saveIdea(contentBrief);

    res.json({
      success: true,
      ideaId,
      contentBrief,
      message: "Idea approved and ready for Phase 2",
    });
  } catch (error) {
    console.error("Select idea error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /ideation/my-ideas
 * Get all ideas for a user
 */
async function getUserIdeasHandler(req, res) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    let ideas = await getUserIdeas(userId);
    
    // Backward compatibility fallback for legacy ideas saved under user-123.
    if (ideas.length === 0 && userId !== 'user-123') {
      ideas = await getUserIdeas('user-123');
    }

    res.json({
      success: true,
      ideas,
      count: ideas.length,
    });
  } catch (error) {
    console.error("Get user ideas error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /ideation/enrich-research
 * Generate and persist research for an existing saved idea
 */
async function enrichIdeaResearchHandler(req, res) {
  try {
    const { userId, ideaId } = req.body;

    if (!userId || !ideaId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, ideaId",
      });
    }

    let ownerUserId = userId;
    let existingIdea = await getIdeaById(ownerUserId, ideaId);

    // Support legacy fallback ideas that were stored under user-123
    if (!existingIdea && userId !== "user-123") {
      const legacyIdea = await getIdeaById("user-123", ideaId);
      if (legacyIdea) {
        existingIdea = legacyIdea;
        ownerUserId = "user-123";
      }
    }

    if (!existingIdea) {
      return res.status(404).json({
        success: false,
        error: "Idea not found",
      });
    }

    const creatorProfile = await getCreatorProfileContext(userId);
    const generatedResearch = await researchIdea(
      existingIdea.topic,
      existingIdea.targetAudience || "General audience",
      creatorProfile,
    );

    const normalizedResearch = normalizeResearchPayload(generatedResearch);

    const updatedIdea = await updateIdeaResearch(
      ownerUserId,
      ideaId,
      normalizedResearch,
      normalizedResearch.keyPoints || [],
    );

    res.json({
      success: true,
      research: normalizedResearch,
      idea: updatedIdea,
      message: "Research generated and saved",
    });
  } catch (error) {
    console.error("Enrich idea research error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export {
  generateIdeas,
  refineIdea,
  evaluateIdea,
  researchIdeaHandler,
  selectIdea,
  getUserIdeasHandler,
  enrichIdeaResearchHandler,
};
