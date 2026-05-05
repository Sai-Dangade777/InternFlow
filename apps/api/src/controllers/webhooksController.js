import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import Candidate from "../models/Candidate.js";

const ACTIVE_STATUSES = ["Referral", "NDA", "Active", "Completed"];

const normalizeWebhookStatus = (value) => {
  if (value === "HR Review") {
    return "NDA";
  }
  return ACTIVE_STATUSES.includes(value) ? value : undefined;
};

const isAuthorized = (req) => {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) {
    return true;
  }
  return req.headers["x-internflow-secret"] === secret;
};

export const handleN8nWebhook = async (req, res, next) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: "Invalid webhook secret." });
    }

    const payload =
      req.body?.candidate && typeof req.body.candidate === "object" ? req.body.candidate : req.body;

    const hasCandidatePayload = Boolean(payload?.name || payload?.email);

    if (hasCandidatePayload) {
      const {
        name,
        email,
        phone,
        skills,
        availability = "",
        unpaidConsent,
        inPersonConsent,
        joiningLocation = "",
        internshipDurationWeeks,
        internshipStartDate,
        internshipEndDate,
        projectOverview = "",
        relationshipDeclaration = "",
        referrer,
        mentor,
        referrerName,
        referrerEmail,
        referrerDepartment,
        mentorName,
        mentorEmail,
        mentorTeam,
        status
      } = payload || {};

      if (!name || !email) {
        return res.status(400).json({ error: "Candidate name and email are required." });
      }

      const existingCandidate = await Candidate.findOne({
        $or: [{ email }, ...(phone ? [{ phone }] : [])]
      });

      if (existingCandidate) {
        return res.status(409).json({
          error: "Duplicate candidate detected.",
          candidateId: existingCandidate._id
        });
      }

      const skillsList = Array.isArray(skills)
        ? skills.map((skill) => String(skill).trim()).filter(Boolean)
        : String(skills || "")
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean);

      const normalizedStatus = normalizeWebhookStatus(status);

      const resolvedReferrer = referrer || {
        name: referrerName || "",
        email: referrerEmail || "",
        department: referrerDepartment || ""
      };

      const resolvedMentor = mentor || {
        name: mentorName || "",
        email: mentorEmail || "",
        team: mentorTeam || ""
      };

      const candidate = await Candidate.create({
        name,
        email,
        phone: phone || "",
        skills: skillsList,
        availability,
        domain: payload?.domain || "",
        hasIdProof: String(payload?.hasIdProof) === "true",
        unpaidConsent: String(unpaidConsent) === "true",
        inPersonConsent: String(inPersonConsent) === "true",
        joiningLocation,
        internshipDurationWeeks: internshipDurationWeeks
          ? Number(internshipDurationWeeks)
          : null,
        internshipStartDate: internshipStartDate ? new Date(internshipStartDate) : null,
        internshipEndDate: internshipEndDate ? new Date(internshipEndDate) : null,
        relationshipDeclaration,
        referrer: resolvedReferrer,
        mentor: resolvedMentor,
        status: normalizedStatus,
        timeline: [{ stage: "Referral", note: "Created via webhook." }]
      });

      const notification = await Notification.create({
        type: "webhook",
        channel: "email",
        status: "pending",
        recipient:
          resolvedMentor?.email || resolvedReferrer?.email || candidate.email || "",
        subject: "New candidate created",
        body: `${candidate.name} has been added via automation.`,
        candidateId: candidate._id
      });

      await AuditLog.create({
        action: "webhook.candidate.created",
        actor: "n8n",
        metadata: { candidate: candidate.name },
        candidateId: candidate._id
      });

      return res.json({
        status: "ok",
        candidateId: candidate._id,
        notificationId: notification._id
      });
    }

    const { type, recipient, subject, body, candidateId } = req.body || {};

    const notification = await Notification.create({
      type: type || "automation",
      channel: "email",
      status: "pending",
      recipient: recipient || "",
      subject: subject || "",
      body: body || "",
      candidateId: candidateId || null
    });

    await AuditLog.create({
      action: "n8n.webhook.received",
      actor: "n8n",
      metadata: { type: notification.type },
      candidateId: notification.candidateId
    });

    return res.json({ status: "ok", notificationId: notification._id });
  } catch (error) {
    return next(error);
  }
};

export const handleNdaSignatureWebhook = async (req, res, next) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: "Invalid webhook secret." });
    }

    const payload = req.body || {};
    const candidateId = payload.candidateId || payload.candidate?.id;
    const email = payload.email || payload.candidate?.email;
    const provider = payload.provider || "esign";
    const envelopeId = payload.envelopeId || payload.envelope_id || "";
    const rawStatus = String(payload.status || payload.event || "").toLowerCase();
    const signed = ["signed", "completed", "success"].includes(rawStatus);
    const declined = ["declined", "rejected", "voided"].includes(rawStatus);

    if (!candidateId && !email) {
      return res.status(400).json({ error: "candidateId or email is required." });
    }

    const lookup = candidateId ? { _id: candidateId } : { email };
    const candidate = await Candidate.findOne(lookup);

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    if (signed) {
      const signedAt = payload.signedAt ? new Date(payload.signedAt) : new Date();
      candidate.nda.status = "Signed";
      candidate.nda.signedAt = signedAt;
      candidate.ndaSignedAt = signedAt;
      candidate.sla.ndaStatus = "met";
      if (candidate.status === "Referral") {
        candidate.status = "NDA";
      }
      candidate.timeline.push({
        stage: "NDA",
        note: `NDA signed via ${provider}${envelopeId ? ` (${envelopeId})` : ""}.`
      });
    } else if (declined) {
      candidate.nda.status = "Declined";
      candidate.timeline.push({
        stage: "NDA",
        note: `NDA declined via ${provider}${envelopeId ? ` (${envelopeId})` : ""}.`
      });
    } else {
      candidate.timeline.push({
        stage: "NDA",
        note: `NDA webhook received from ${provider}${envelopeId ? ` (${envelopeId})` : ""} with status ${rawStatus || "unknown"}.`
      });
    }

    await candidate.save();

    await AuditLog.create({
      action: "webhook.nda.signature",
      actor: provider,
      metadata: {
        status: rawStatus || "unknown",
        envelopeId
      },
      candidateId: candidate._id
    });

    if (signed) {
      await Notification.create({
        type: "nda",
        channel: "email",
        status: "pending",
        recipient: candidate.email,
        subject: "NDA signed",
        body: `${candidate.name} has completed NDA e-signature.`,
        candidateId: candidate._id
      });
    }

    return res.json({
      status: "ok",
      candidateId: candidate._id,
      ndaStatus: candidate.nda.status
    });
  } catch (error) {
    return next(error);
  }
};
