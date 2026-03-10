import dotenv from "dotenv";
// load environment variables before importing application modules
dotenv.config();

import app from "./config/app.js";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n✅ Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}\n`);

  // Warn about missing critical env vars at startup
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(
      "⚠️  WARNING: SMTP_USER/SMTP_PASS are not set — emails will fail with Nodemailer.",
    );
    console.warn(
      "   Add SMTP_USER and SMTP_PASS (App Password for Gmail) to backend/.env and restart.\n",
    );
  }
  if (!process.env.SCHEDULER_LAMBDA_ARN) {
    console.warn(
      "⚠️  WARNING: SCHEDULER_LAMBDA_ARN is not set — EventBridge reminder emails will not fire.\n",
    );
  }
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
