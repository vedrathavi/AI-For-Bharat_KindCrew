import express from "express";
import cors from "cors";
import session from "express-session";
import errorHandler from "../middleware/errorHandler.js";
import authRoutes from "../routes/authRoutes.js";
import creatorProfileRoutes from "../routes/creatorProfileRoutes.js";
import bedrockRoutes from "../routes/bedrockRoutes.js";
import ideationRoutes from "../routes/ideationRoutes.js";
import contentRoutes from "../routes/contentRoutes.js";
import { getAllUsersAndProfiles } from "../controllers/creatorProfileController.js";

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "kindcrew-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Request logging middleware
app.use((req, res, next) => {
  console.log(` ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to AI-For-Bharat KindCrew API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Test route alias to list all users and profiles (disabled in production by controller)
app.get("/api/test/all-data", getAllUsersAndProfiles);

// Auth routes
app.use("/api/auth", authRoutes);

// Creator Profile routes
app.use("/api", creatorProfileRoutes);

// Bedrock AI routes
app.use("/api/bedrock", bedrockRoutes);

// Phase 1: Ideation & Research routes
app.use("/api/ideation", ideationRoutes);

// Phase 2: Content Generation routes
app.use("/api/content", contentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.path,
  });
});

// Error handler
app.use(errorHandler);

export default app;
