import { Router } from "express";
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

router.get("/", listCandidates);
router.get("/summary", getCandidateSummary);
router.post("/demo-seed", seedDemoCandidates);
router.patch("/:id/status", updateCandidateStatus);
router.patch("/:id/joining-form", updateJoiningForm);
router.patch("/:id/nda", updateNdaStatus);
router.patch("/:id/access", updateAccessProvisioning);
router.patch("/:id/lifecycle", updateLifecycle);
router.patch("/:id/certificate", requestCertificate);
router.post("/:id/letters/:type", generateCandidateLetter);

export default router;
