import dotenv from "dotenv";
// load environment variables before importing application modules
dotenv.config();

import app from "./config/app.js";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n✅ Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}\n`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("🔴 Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("🔴 Uncaught Exception:", err);
  process.exit(1);
});

export default server;
