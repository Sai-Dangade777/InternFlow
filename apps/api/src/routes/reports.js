import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getComplianceMetrics } from "../controllers/reportsController.js";

const router = Router();

const metricsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router.get("/metrics", metricsLimiter, getComplianceMetrics);

export default router;
