import { Router } from "express";
import { parseResumeWithOpenAI } from "../services/openaiResumeParser.js";
import { evaluateCandidateWithOpenAI } from "../services/openaiCandidateEvaluator.js";
import { validateReferralWithAI } from "../services/openaiReferralValidator.js";
import { draftCommunicationWithAI } from "../services/openaiCommunicationDrafter.js";
import { generateCandidateReadinessInsight, assessNdaReadiness, assessWorkflowRisk, generateOnboardingChecklist } from "../services/aiInsightService.js";
import Candidate from "../models/Candidate.js";
import { authenticate, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);

router.post("/parse-resume", requireRole(["admin", "hr"]), async (req, res, next) => {
  try {
    const { resumeText } = req.body;
    const result = await parseResumeWithOpenAI({ resumeText });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/evaluate", requireRole(["admin", "hr"]), async (req, res, next) => {
  try {
    const { skills, education, availability, domain, status, readinessExplanation } = req.body;
    const result = await evaluateCandidateWithOpenAI({
      skills,
      education,
      availability,
      domain,
      status,
      readinessExplanation
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/validate-referral", requireRole(["admin", "hr"]), async (req, res, next) => {
  try {
    const payload = req.body || {};
    const duplicateConditions = [];
    if (payload.email) {
      duplicateConditions.push({ email: payload.email });
    }
    if (payload.phone) {
      duplicateConditions.push({ phone: payload.phone });
    }

    const duplicateMatches = duplicateConditions.length
      ? await Candidate.find({ $or: duplicateConditions })
          .select("name email phone status domain createdAt")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
      : [];

    const result = await validateReferralWithAI({
      payload,
      duplicateMatches
    });
    res.json({
      ...result,
      data: {
        ...(result.data || {}),
        duplicateMatches
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/draft-email", requireRole(["admin", "hr"]), async (req, res, next) => {
  try {
    const { type, candidate } = req.body || {};
    if (!candidate) {
      return res.status(400).json({ error: "Candidate context is required." });
    }
    const result = await draftCommunicationWithAI({
      type: type || "status-update",
      candidate
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Generate AI readiness insight for a candidate
 */
router.post("/insight", requireRole(["admin", "hr", "candidate"]), async (req, res, next) => {
  try {
    const { candidateId } = req.body;

    let candidate;
    if (candidateId) {
      candidate = await Candidate.findById(candidateId);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
    } else {
      candidate = req.body;
    }

    const insight = await generateCandidateReadinessInsight(candidate);
    
    res.json({ data: insight });
  } catch (error) {
    next(error);
  }
});

/**
 * Assess NDA readiness for a candidate
 */
router.post("/nda-readiness", requireRole(["admin", "hr", "candidate"]), async (req, res, next) => {
  try {
    const { candidateId } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const readiness = assessNdaReadiness(candidate);
    
    res.json({ data: readiness });
  } catch (error) {
    next(error);
  }
});

/**
 * Assess workflow risk for a candidate
 */
router.post("/workflow-risk", requireRole(["admin", "hr"]), async (req, res, next) => {
  try {
    const { candidateId } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const risk = assessWorkflowRisk(candidate);
    
    res.json({ data: risk });
  } catch (error) {
    next(error);
  }
});

/**
 * Get onboarding checklist for a candidate
 */
router.post("/onboarding-checklist", requireRole(["admin", "hr", "candidate"]), async (req, res, next) => {
  try {
    const { candidateId } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const checklist = generateOnboardingChecklist(candidate);
    
    res.json({ data: checklist });
  } catch (error) {
    next(error);
  }
});

export default router;
