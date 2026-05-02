import { Router } from "express";
import { getComplianceMetrics } from "../controllers/reportsController.js";

const router = Router();

router.get("/metrics", getComplianceMetrics);

export default router;
