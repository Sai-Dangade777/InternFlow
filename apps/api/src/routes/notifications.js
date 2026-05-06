import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/auth.js";
import {
  acknowledgeNotification,
  createNotification,
  listNotifications
} from "../controllers/notificationsController.js";

const router = Router();

router.use(authenticate);

router.get("/", requireRole(["admin", "hr", "it", "compliance", "candidate"]), listNotifications);
router.post("/", requireRole(["admin", "hr", "it", "compliance"]), createNotification);
router.patch("/:id/ack", requireRole(["admin", "hr", "it", "compliance", "candidate"]), acknowledgeNotification);

export default router;
