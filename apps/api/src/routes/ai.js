import { Router } from "express";
import { parseResumeWithOpenAI } from "../services/openaiResumeParser.js";
import { evaluateCandidateWithOpenAI } from "../services/openaiCandidateEvaluator.js";
import { validateReferralWithAI } from "../services/openaiReferralValidator.js";
import { draftCommunicationWithAI } from "../services/openaiCommunicationDrafter.js";
import Candidate from "../models/Candidate.js";

const router = Router();

router.post("/parse-resume", async (req, res, next) => {
  try {
    const { resumeText } = req.body;
    const result = await parseResumeWithOpenAI({ resumeText });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/evaluate", async (req, res, next) => {
  try {
    const { skills, education, availability } = req.body;
    const result = await evaluateCandidateWithOpenAI({
      skills,
      education,
      availability
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/validate-referral", async (req, res, next) => {
  try {
    const payload = req.body || {};
    const duplicateMatches = await Candidate.find({
      $or: [{ email: payload.email }, { phone: payload.phone }]
    })
      .select("name email phone")
      .lean();

    const result = await validateReferralWithAI({
      payload,
      duplicateMatches
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/draft-email", async (req, res, next) => {
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

export default router;
