import { Router } from "express";
import {
	handleN8nWebhook,
	handleNdaSignatureWebhook
} from "../controllers/webhooksController.js";

const router = Router();

router.post("/n8n", handleN8nWebhook);
router.post("/nda-signature", handleNdaSignatureWebhook);

export default router;
