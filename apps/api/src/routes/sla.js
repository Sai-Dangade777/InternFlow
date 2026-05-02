import { Router } from "express";
import { evaluateSlaRisk } from "../services/slaRiskService.js";

const router = Router();

router.post("/risk", async (req, res, next) => {
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
