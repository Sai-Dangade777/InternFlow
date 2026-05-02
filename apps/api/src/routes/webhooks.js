import { Router } from "express";
import { handleN8nWebhook } from "../controllers/webhooksController.js";

const router = Router();

router.post("/n8n", handleN8nWebhook);

export default router;
