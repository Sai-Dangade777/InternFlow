import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
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

router.post("/", upload.single("resume"), createReferral);

export default router;
