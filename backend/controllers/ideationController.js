import {
  generateIdeasFlow,
  refineIdeaFlow,
  evaluateIdeaFlow,
  researchIdeaFlow,
  refreshResearchFlow,
  selectIdeaFlow,
  getUserIdeasFlow,
  getUserSnapshotsFlow,
  enrichIdeaResearchFlow,
  deleteIdeaFlow,
} from "../src/modules/ideation/ideation.service.js";

import {
  GenerateIdeasRequestSchema,
  RefineIdeaRequestSchema,
  EvaluateIdeaRequestSchema,
  ResearchIdeaRequestSchema,
  RefreshResearchRequestSchema,
  SelectIdeaRequestSchema,
} from "../src/modules/ideation/schemas/ideation.schemas.js";

function getAuthenticatedUserId(req, res) {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return null;
  }
  return userId;
}

/**
 * POST /api/ideation/generate
 * Zero Idea Flow - Generate 3-7 research-backed opportunities
 */
export async function generateIdeas(req, res) {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const parseResult = GenerateIdeasRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const result = await generateIdeasFlow(userId, parseResult.data);
    res.json(result);
  } catch (error) {
    console.error("Generate ideas error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/ideation/refine
 * Some Idea Flow - Refine rough idea into strategic angles
 */
export async function refineIdea(req, res) {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const parseResult = RefineIdeaRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const result = await refineIdeaFlow(userId, parseResult.data);
    res.json(result);
  } catch (error) {
    console.error("Refine idea error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/ideation/evaluate
 * Full Idea Flow - Evaluate and suggest hooks/improvements
 */
export async function evaluateIdea(req, res) {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const parseResult = EvaluateIdeaRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const result = await evaluateIdeaFlow(userId, parseResult.data);
    res.json(result);
  } catch (error) {
    console.error("Evaluate idea error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/ideation/research
 * Research an idea - returns complete ResearchSnapshot
 */
export async function researchIdeaHandler(req, res) {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const parseResult = ResearchIdeaRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const result = await researchIdeaFlow(userId, parseResult.data);
    res.json(result);
  } catch (error) {
    console.error("Research idea error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/ideation/refresh-research
 * Explicit controlled refresh of an existing research snapshot
 */
export async function refreshResearchHandler(req, res) {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const parseResult = RefreshResearchRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const result = await refreshResearchFlow(
      userId,
      parseResult.data.snapshotId,
      parseResult.data.enableLiveWebSearch
    );
    res.json(result);
  } catch (error) {
    console.error("Refresh research error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * DELETE /api/ideation/ideas/:ideaId
 * Delete a saved idea (enforces userId session ownership)
 */
export async function deleteIdeaHandler(req, res) {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const { ideaId } = req.params;
    if (!ideaId) {
      return res.status(400).json({ success: false, error: "Missing ideaId" });
    }

    const result = await deleteIdeaFlow(userId, ideaId);
    res.json(result);
  } catch (error) {
    console.error("Delete idea error:", error);
    const statusCode = error.message.includes("access denied") || error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/ideation/select
 * Select idea and attach Stage1To2Contract v2.0
 */
export async function selectIdea(req, res) {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const parseResult = SelectIdeaRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const result = await selectIdeaFlow(userId, parseResult.data);
    res.json(result);
  } catch (error) {
    console.error("Select idea error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/ideation/my-ideas
 * Get all ideas for a user
 */
export async function getUserIdeasHandler(req, res) {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const result = await getUserIdeasFlow(userId);
    res.json(result);
  } catch (error) {
    console.error("Get user ideas error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/ideation/enrich-research
 * Enrich research on existing saved idea and persist to database
 */
export async function enrichIdeaResearchHandler(req, res) {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const { ideaId } = req.body;
    if (!ideaId) {
      return res.status(400).json({ success: false, error: "Missing ideaId" });
    }

    const result = await enrichIdeaResearchFlow(userId, ideaId);
    res.json(result);
  } catch (error) {
    console.error("Enrich idea research error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/ideation/history
 * Get all past research snapshots for a user
 */
export async function getUserSnapshotsHandler(req, res) {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const result = await getUserSnapshotsFlow(userId);
    res.json(result);
  } catch (error) {
    console.error("Get user research history error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
