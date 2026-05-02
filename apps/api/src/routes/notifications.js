import { Router } from "express";
import {
  acknowledgeNotification,
  createNotification,
  listNotifications
} from "../controllers/notificationsController.js";

const router = Router();

router.get("/", listNotifications);
router.post("/", createNotification);
router.patch("/:id/ack", acknowledgeNotification);

export default router;
