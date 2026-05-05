import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  listCandidates,
  getCandidateSummary,
  updateCandidateStatus,
  updateJoiningForm,
  updateNdaStatus,
  updateAccessProvisioning,
  updateLifecycle,
  requestCertificate,
  generateCandidateLetter,
  seedDemoCandidates
} from "../controllers/candidatesController.js";

const router = Router();

const accessProvisioningLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

const ndaStatusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

router.get("/", listCandidates);
router.get("/summary", getCandidateSummary);
router.post("/demo-seed", seedDemoCandidates);
router.patch("/:id/status", updateCandidateStatus);
router.patch("/:id/joining-form", updateJoiningForm);
router.patch("/:id/nda", ndaStatusLimiter, updateNdaStatus);
router.patch("/:id/access", accessProvisioningLimiter, updateAccessProvisioning);
router.patch("/:id/lifecycle", updateLifecycle);
router.patch("/:id/certificate", requestCertificate);
router.post("/:id/letters/:type", generateCandidateLetter);

export default router;
