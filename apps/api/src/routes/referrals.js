import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import { createReferral } from "../controllers/referralsController.js";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDirectory = path.resolve(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "-");
    callback(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const createReferralLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

router.post("/", createReferralLimiter, upload.single("resume"), createReferral);

export default router;
