import express from "express";
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  suggestTime,
} from "../controllers/publishingController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Phase 3 – Planning & Scheduling routes
router.post("/schedule/create", authMiddleware, createEvent);
router.post("/schedule/suggest-time", authMiddleware, suggestTime);
router.get("/schedule/events", authMiddleware, getEvents);
router.get("/schedule/:eventId", authMiddleware, getEvent);
router.patch("/schedule/update", authMiddleware, updateEvent);
router.delete("/schedule/:eventId", authMiddleware, deleteEvent);

export default router;
