import Candidate from "../models/Candidate.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import { evaluateCandidateWithOpenAI } from "../services/openaiCandidateEvaluator.js";
import { parseResumeWithOpenAI } from "../services/openaiResumeParser.js";

const buildDuplicateConditions = ({ email, phone }) => {
  const conditions = [];
  if (email) {
    conditions.push({ email });
  }
  if (phone) {
    conditions.push({ phone });
  }
  return conditions;
};

export const createReferral = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      skills = "",
      availability = "",
      unpaidConsent,
      inPersonConsent,
      hasIdProof,
      joiningLocation,
      domain,
      internshipDurationWeeks,
      internshipStartDate,
      internshipEndDate,
      relationshipDeclaration,
      referrerName,
      referrerEmail,
      referrerDepartment,
      resumeText,
      education
    } = req.body;
    const resume = req.file;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Name, email, and phone are required." });
    }

    if (!referrerName) {
      return res.status(400).json({ error: "Referrer details are required." });
    }

    if (
      String(unpaidConsent) !== "true" ||
      String(inPersonConsent) !== "true" ||
      String(hasIdProof) !== "true"
    ) {
      return res.status(400).json({
        error: "Eligibility consent (unpaid, in-person, and ID proof) is required."
      });
    }

    if (
      !joiningLocation ||
      !domain ||
      !internshipDurationWeeks ||
      !internshipStartDate ||
      !internshipEndDate ||
      !relationshipDeclaration
    ) {
      return res.status(400).json({ error: "Internship details are required." });
    }

    const duplicateConditions = buildDuplicateConditions({ email, phone });
    const duplicateMatches = duplicateConditions.length
      ? await Candidate.find({ $or: duplicateConditions })
          .select("name email phone status domain createdAt")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
      : [];

    if (duplicateMatches.length > 0) {
      return res.status(409).json({
        error: "Duplicate candidate detected.",
        candidateId: duplicateMatches[0]._id,
        possibleMatches: duplicateMatches
      });
    }

    const skillsList = skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    let educationList = [];
    if (education) {
      try {
        educationList = typeof education === "string" ? JSON.parse(education) : education;
      } catch (error) {
        educationList = [];
      }
    }

    let parsedResume = null;
    if (resumeText) {
      try {
        const parsed = await parseResumeWithOpenAI({ resumeText });
        parsedResume = parsed?.data || null;
      } catch (error) {
        parsedResume = null;
      }
    }

    const finalSkills =
      skillsList.length > 0
        ? skillsList
        : parsedResume?.skills?.length
        ? parsedResume.skills
        : [];

    const finalEducation =
      educationList.length > 0
        ? educationList
        : parsedResume?.education?.length
        ? parsedResume.education
        : [];

    const candidate = await Candidate.create({
      name,
      email,
      phone,
      skills: finalSkills,
      education: finalEducation,
      availability,
      domain,
      hasIdProof: String(hasIdProof) === "true",
      unpaidConsent: String(unpaidConsent) === "true",
      inPersonConsent: String(inPersonConsent) === "true",
      joiningLocation,
      internshipDurationWeeks: internshipDurationWeeks
        ? Number(internshipDurationWeeks)
        : null,
      internshipStartDate: internshipStartDate ? new Date(internshipStartDate) : null,
      internshipEndDate: internshipEndDate ? new Date(internshipEndDate) : null,
      relationshipDeclaration: relationshipDeclaration || "",
      referrer: {
        name: referrerName,
        email: referrerEmail,
        department: referrerDepartment
      },
      resumePath: resume ? resume.path : "",
      timeline: [
        { stage: "Referral", note: "Submitted via referral form." },
        ...(parsedResume ? [{ stage: "AI Parse", note: "Resume parsed and prefilled." }] : [])
      ]
    });

    try {
        const evaluation = await evaluateCandidateWithOpenAI({
          skills: finalSkills,
          education: candidate.education || [],
          availability
        });
      if (evaluation?.data) {
        candidate.score = evaluation.data.score;
        candidate.readinessExplanation = evaluation.data.explanation || "";
        candidate.timeline.push({
          stage: "AI Review",
          note: "AI readiness evaluation completed."
        });
        await candidate.save();
      }
    } catch (error) {
      candidate.readinessExplanation = "AI scoring unavailable."
      await candidate.save();
    }

    await Notification.create({
      type: "referral",
      channel: "email",
      status: "pending",
      recipient: referrerEmail || email || "",
      subject: "New referral received",
      body: `${name} has been referred. Review the candidate in Intern Flow.`,
      candidateId: candidate._id
    });

    await AuditLog.create({
      action: "referral.submitted",
      actor: referrerEmail || "system",
      metadata: { candidate: name },
      candidateId: candidate._id
    });

    return res.status(201).json({
      message: "Referral received",
      candidate
    });
  } catch (error) {
    return next(error);
  }
};
