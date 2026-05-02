import Candidate from "../models/Candidate.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import { evaluateCandidateWithOpenAI } from "../services/openaiCandidateEvaluator.js";
import { parseResumeWithOpenAI } from "../services/openaiResumeParser.js";

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
      joiningLocation,
      internshipDurationWeeks,
      internshipStartDate,
      internshipEndDate,
      projectOverview,
      relationshipDeclaration,
      referrerName,
      referrerEmail,
      referrerDepartment,
      mentorName,
      mentorEmail,
      mentorTeam,
      resumeText,
      education
    } = req.body;
    const resume = req.file;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Name, email, and phone are required." });
    }

    if (!referrerName || !mentorName) {
      return res.status(400).json({ error: "Referrer and mentor details are required." });
    }

    if (String(unpaidConsent) !== "true" || String(inPersonConsent) !== "true") {
      return res.status(400).json({
        error: "Eligibility consent (unpaid and in-person) is required."
      });
    }

    if (
      !joiningLocation ||
      !internshipDurationWeeks ||
      !internshipStartDate ||
      !internshipEndDate ||
      !projectOverview ||
      !relationshipDeclaration
    ) {
      return res.status(400).json({ error: "Internship details are required." });
    }

    const existingCandidate = await Candidate.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingCandidate) {
      return res.status(409).json({
        error: "Duplicate candidate detected.",
        candidateId: existingCandidate._id
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
      unpaidConsent: String(unpaidConsent) === "true",
      inPersonConsent: String(inPersonConsent) === "true",
      joiningLocation,
      internshipDurationWeeks: internshipDurationWeeks
        ? Number(internshipDurationWeeks)
        : null,
      internshipStartDate: internshipStartDate ? new Date(internshipStartDate) : null,
      internshipEndDate: internshipEndDate ? new Date(internshipEndDate) : null,
      projectOverview: projectOverview || "",
      relationshipDeclaration: relationshipDeclaration || "",
      referrer: {
        name: referrerName,
        email: referrerEmail,
        department: referrerDepartment
      },
      mentor: {
        name: mentorName,
        email: mentorEmail,
        team: mentorTeam
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
      recipient: mentorEmail || referrerEmail || "",
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
