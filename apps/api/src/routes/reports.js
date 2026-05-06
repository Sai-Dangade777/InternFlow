import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { getComplianceMetrics } from "../controllers/reportsController.js";

const router = Router();

const metricsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router.use(authenticate);
router.get("/metrics", requireRole(["admin", "hr", "compliance"]), metricsLimiter, getComplianceMetrics);

export default router;
