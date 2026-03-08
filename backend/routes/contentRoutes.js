import express from "express";
import {
  createFromIdeaHandler,
  createFromManualHandler,
  getContentHandler,
  getUserContentHandler,
  generateOutlineHandler,
  generateDraftHandler,
  regenerateVariantHandler,
  updateStatusHandler,
} from "../controllers/contentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

// Main content creation endpoints
router.post("/from-idea", createFromIdeaHandler);
router.post("/from-manual", createFromManualHandler);

// Get content
router.get("/user", getUserContentHandler);
router.get("/:contentId", getContentHandler);

// Individual generation steps (for preview/refinement)
router.post("/generate-outline", generateOutlineHandler);
router.post("/generate-draft", generateDraftHandler);

// Regenerate specific platform variant
router.post("/regenerate-variant", regenerateVariantHandler);

// Update distribution status
router.post("/update-status", updateStatusHandler);

export default router;
