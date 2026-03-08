import express from "express";
import { converse, healthCheck } from "../controllers/bedrockController.js";

const router = express.Router();

// POST /api/bedrock/converse - Send message
router.post("/converse", converse);

// POST /api/bedrock/health-check - Check service status
router.post("/health-check", healthCheck);

export default router;
