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
  await fs.mkdir(uploadsPath, { recursive: true });
  await connectToDatabase(process.env.MONGODB_URI);

  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
