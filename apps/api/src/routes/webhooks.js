import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
	handleN8nWebhook,
	handleNdaSignatureWebhook
} from "../controllers/webhooksController.js";

const router = Router();

const webhookRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per window
	standardHeaders: true,
	legacyHeaders: false
});

router.post("/n8n", webhookRateLimiter, handleN8nWebhook);
router.post("/nda-signature", webhookRateLimiter, handleNdaSignatureWebhook);

export default router;
