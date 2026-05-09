import "dotenv/config";
import app from "./app.js";
import { connectToDatabase } from "./config/db.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const port = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.resolve(__dirname, "../uploads");

const startServer = async () => {
  try {
    console.log("[SERVER] Creating uploads directory...");
    await fs.mkdir(uploadsPath, { recursive: true });
    console.log("[SERVER] Uploads directory ready");

    console.log("[SERVER] Connecting to MongoDB...");
    await connectToDatabase(process.env.MONGODB_URI);
    console.log("[SERVER] MongoDB connected");
  } catch (error) {
    console.warn("[SERVER] MongoDB connection warning (continuing with degraded functionality):", error.message);
  }

  app.listen(port, () => {
    console.log(`[SERVER] API listening on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("[SERVER] Failed to start API", error);
  process.exit(1);
});
