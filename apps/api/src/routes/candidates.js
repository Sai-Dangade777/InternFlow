import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  import { authenticate, requireRole } from "../middlewares/auth.js";
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
  router.use(authenticate);

  router.get("/", requireRole(["admin", "hr", "it", "compliance"]), listCandidates);
  router.get("/summary", requireRole(["admin", "hr", "it", "compliance"]), getCandidateSummary);
  router.post("/demo-seed", requireRole("admin"), seedDemoCandidates);
  router.patch("/:id/status", requireRole(["admin", "hr"]), updateCandidateStatus);
  router.patch("/:id/joining-form", requireRole(["admin", "hr", "candidate"]), updateJoiningForm);
  router.patch("/:id/nda", requireRole(["admin", "hr", "candidate"]), ndaStatusLimiter, updateNdaStatus);
  router.patch("/:id/access", requireRole(["admin", "it"]), accessProvisioningLimiter, updateAccessProvisioning);
  router.patch("/:id/lifecycle", requireRole(["admin", "hr"]), updateLifecycle);
  router.patch("/:id/certificate", requireRole(["admin", "hr", "candidate"]), requestCertificate);
  router.post("/:id/letters/:type", requireRole(["admin", "hr"]), generateCandidateLetter);
export default router;
