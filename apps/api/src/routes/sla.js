import { Router } from "express";
import { evaluateSlaRisk } from "../services/slaRiskService.js";
import { authenticate, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);

router.post("/risk", requireRole(["admin", "hr", "compliance"]), async (req, res, next) => {
  try {
    const { ndaSignedAt, referralCreatedAt, hrReviewed } = req.body;
    const result = await evaluateSlaRisk({
      ndaSignedAt,
      referralCreatedAt,
      hrReviewed
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
