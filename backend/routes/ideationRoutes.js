import express from "express";
import {
  generateIdeas,
  refineIdea,
  evaluateIdea,
  researchIdeaHandler,
  refreshResearchHandler,
  selectIdea,
  getUserIdeasHandler,
  deleteIdeaHandler,
  enrichIdeaResearchHandler,
  getUserSnapshotsHandler,
} from "../controllers/ideationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

/**
 * Phase 1: Ideation & Research Routes
 */

// Zero Idea Flow - Generate ideas from profile
router.post("/generate", generateIdeas);

// Some Idea Flow - Refine rough idea
router.post("/refine", refineIdea);

// Full Idea Flow - Evaluate full idea
router.post("/evaluate", evaluateIdea);

// Research an idea
router.post("/research", researchIdeaHandler);

// Explicit Controlled Refresh of Research Snapshot
router.post("/refresh-research", refreshResearchHandler);

// Generate and persist research for an existing saved idea
router.post("/enrich-research", enrichIdeaResearchHandler);

// Select and approve idea
router.post("/select", selectIdea);

// Get user's ideas
router.get("/my-ideas", getUserIdeasHandler);

// Delete an idea
router.delete("/ideas/:ideaId", deleteIdeaHandler);

// Get user's past research sessions history
router.get("/history", getUserSnapshotsHandler);

export default router;
