import Candidate from "../models/Candidate.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import { generateCandidateReadinessInsight, assessNdaReadiness, assessWorkflowRisk } from "../services/aiInsightService.js";
import { sendNdaSigningEmail, sendOfferLetterEmail, sendCertificateEmail } from "../services/mailService.js";
import { generateOfferLetterPdf, generateCertificatePdf, generateClosureLetterPdf } from "../services/pdfService.js";

const buildSummary = (candidates) => {
  const summary = {
    total: candidates.length,
    pending: 0,
    inProgress: 0,
    completed: 0
  };

  candidates.forEach((candidate) => {
    if (candidate.status === "Completed") {
      summary.completed += 1;
    } else if (candidate.status === "Active") {
      summary.inProgress += 1;
    } else {
      summary.pending += 1;
    }
  });

  return summary;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Helper to generate Non-Worker ID
const generateNonWorkerId = async () => {
  const year = new Date().getFullYear();
  const count = await Candidate.countDocuments({
    "joiningForm.nonWorkerId": { $regex: `^NW-${year}` }
  });
  return `NW-${year}-${String(count + 1).padStart(4, "0")}`;
};

const evaluateSlaItem = ({ label, dueAt, met }) => {
  if (!dueAt) {
    return { label, status: "not-set", dueAt: null };
  }
  const due = new Date(dueAt);
  if (met) {
    return { label, status: "met", dueAt: due.toISOString() };
  }
  if (Date.now() > due.getTime()) {
    return { label, status: "breach", dueAt: due.toISOString() };
  }
  return { label, status: "pending", dueAt: due.toISOString() };
};

const computeSlaStatus = (candidate) => {
  const nonWorkerId = evaluateSlaItem({
    label: "Non-Worker ID",
    dueAt: candidate.sla?.nonWorkerIdDueAt,
    met: Boolean(candidate.joiningForm?.nonWorkerId)
  });
  const nda = evaluateSlaItem({
    label: "NDA Signed",
    dueAt: candidate.sla?.ndaDueAt,
    met: candidate.nda?.status === "Signed"
  });
  const accessDeactivation = evaluateSlaItem({
    label: "AD Deactivation",
    dueAt: candidate.sla?.accessDeactivationDueAt,
    met: candidate.accessProvisioning?.status === "Deactivated"
  });

  const items = [nonWorkerId, nda, accessDeactivation];
  const hasBreach = items.some((item) => item.status === "breach");
  const hasPending = items.some((item) => item.status === "pending");
  const overallRisk = hasBreach ? "HIGH" : hasPending ? "MEDIUM" : "LOW";

  return { overallRisk, items };
};

const withSlaStatus = (candidate) => {
  const data = candidate?.toObject ? candidate.toObject() : candidate;
  return { ...data, slaStatus: computeSlaStatus(data) };
};

const formatDate = (value) => {
  if (!value) {
    return "TBD";
  }
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const buildOfferLetter = (candidate) => {
  return `Offer Letter\n\nDear ${candidate.name},\n\nWe are excited to offer you an unpaid internship with Intern Flow. Your internship is scheduled to start on ${formatDate(
    candidate.internshipStartDate
  )} and run for ${candidate.internshipDurationWeeks || "TBD"} weeks.\n\nPlease review and sign the NDA before your start date. Reach out to the program office for any questions.\n\nRegards,\nIntern Flow Program Office`;
};

const buildStartConfirmation = (candidate) => {
  return `Start Confirmation\n\nHi ${candidate.name},\n\nYour internship start is confirmed for ${formatDate(
    candidate.lifecycle?.startDate || candidate.internshipStartDate
  )}. Please ensure your NDA is signed and your Non-Worker ID is active.\n\nAccess credentials will be shared via secure email.\n\nThanks,\nIntern Flow Operations`;
};

const buildClosureLetter = (candidate) => {
  return `Closure Confirmation\n\nHi ${candidate.name},\n\nYour internship concluded on ${formatDate(
    candidate.lifecycle?.closureDate
  )}. Thank you for your contributions.\n\nPlease request your completion certificate if you have not already.\n\nRegards,\nIntern Flow Program Office`;
};

const buildCertificate = (candidate) => {
  return `Certificate of Completion\n\nThis is to certify that ${candidate.name} successfully completed an unpaid internship with Intern Flow.\n\nDuration: ${formatDate(
    candidate.lifecycle?.startDate || candidate.internshipStartDate
  )} to ${formatDate(candidate.lifecycle?.closureDate || candidate.internshipEndDate)}\n\nIssued by Intern Flow Program Office`;
};

const createAuditEntry = async ({ action, actor = "system", metadata = {}, candidateId }) => {
  try {
    await AuditLog.create({ action, actor, metadata, candidateId });
  } catch (error) {
    // Keep audit optional for demo resilience.
  }
};

const createNotificationEntry = async ({
  type,
  subject,
  body,
  recipient = "",
  candidateId
}) => {
  try {
    await Notification.create({
      type,
      channel: "email",
      status: "pending",
      recipient,
      subject,
      body,
      candidateId
    });
  } catch (error) {
    // Notifications are best-effort for demo flows.
  }
};

export const listCandidates = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status !== undefined) {
      const allowedStatuses = new Set(["Completed", "Active", "Pending"]);
      if (typeof req.query.status !== "string" || !allowedStatuses.has(req.query.status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      filter.status = { $eq: req.query.status };
    }

    const candidates = await Candidate.find(filter).sort({ createdAt: -1 }).lean();
    const enriched = candidates.map((candidate) => ({
      ...candidate,
      slaStatus: computeSlaStatus(candidate)
    }));
    res.json({ items: enriched });
  } catch (error) {
    next(error);
  }
};

export const getCandidateSummary = async (req, res, next) => {
  try {
    const candidates = await Candidate.find({}).lean();
    const summary = buildSummary(candidates);
    const slaStatuses = candidates.map((candidate) => computeSlaStatus(candidate));
    const breaches = slaStatuses.filter((item) => item.overallRisk === "HIGH").length;
    const atRisk = slaStatuses.filter((item) => item.overallRisk === "MEDIUM").length;
    res.json({ summary: { ...summary, slaBreaches: breaches, slaAtRisk: atRisk } });
  } catch (error) {
    next(error);
  }
};

export const updateCandidateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required." });
    }

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    const previousStatus = candidate.status;
    candidate.status = status;

    // Auto-trigger workflows based on status change
    if (status === "NDA" && previousStatus !== "NDA") {
      candidate.nda = candidate.nda || {};
      candidate.nda.status = "Issued";
      candidate.nda.issuedAt = new Date();

      // Send NDA signing email
      const ndaLink = `${process.env.CORS_ORIGIN || "http://localhost:5173"}/nda-sign/${candidate._id}`;
      try {
        await sendNdaSigningEmail(candidate.email, candidate.name, ndaLink);
      } catch (emailError) {
        console.warn("Failed to send NDA email:", emailError.message);
      }

      const notification = new Notification({
        type: "nda-issued",
        title: "NDA Ready for Signing",
        message: `NDA has been issued to ${candidate.name}. Email sent with signing link.`,
        candidateId: candidate._id,
        referenceId: candidate._id,
        read: false
      });
      await notification.save();
    }

    // Auto-generate Non-Worker ID when transitioning to Active
    if (status === "Active" && previousStatus !== "Active") {
      if (!candidate.joiningForm?.nonWorkerId) {
        candidate.joiningForm = candidate.joiningForm || {};
        candidate.joiningForm.nonWorkerId = await generateNonWorkerId();

        const notification = new Notification({
          type: "non-worker-id-generated",
          title: "Non-Worker ID Generated",
          message: `Non-Worker ID ${candidate.joiningForm.nonWorkerId} generated for ${candidate.name}`,
          candidateId: candidate._id,
          referenceId: candidate._id,
          read: false
        });
        await notification.save();
      }

      candidate.lifecycle = candidate.lifecycle || {};
      candidate.lifecycle.startDate = new Date();

      const notification = new Notification({
        type: "internship-started",
        title: "Internship Started",
        message: `${candidate.name}'s internship has officially started`,
        candidateId: candidate._id,
        referenceId: candidate._id,
        read: false
      });
      await notification.save();
    }

    if (status === "Completed") {
      candidate.lifecycle = candidate.lifecycle || {};
      candidate.lifecycle.endDate = new Date();
      candidate.lifecycle.closureDate = new Date();

      const notification = new Notification({
        type: "internship-completed",
        title: "Internship Completed",
        message: `${candidate.name}'s internship has been marked as completed`,
        candidateId: candidate._id,
        referenceId: candidate._id,
        read: false
      });
      await notification.save();
    }

    candidate.status = status;
    candidate.timeline.push({ stage: status, note });

    if (status === "NDA") {
      candidate.nda.status = candidate.nda.status === "Signed" ? "Signed" : "Issued";
    }

    await candidate.save();

    await createAuditEntry({
      action: "candidate.status.updated",
      metadata: { status },
      candidateId: candidate._id
    });
    await createNotificationEntry({
      type: "status",
      subject: `Candidate status updated to ${status}`,
      body: `${candidate.name} moved to ${status}.`,
      candidateId: candidate._id
    });

    return res.json({ item: candidate });
  } catch (error) {
    next(error);
  }
};

export const updateJoiningForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, submittedTo, phone, address, emergencyContact, nonWorkerId, governmentId, declarationAccepted } = req.body;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    const restrictedUpdates = [phone, address, emergencyContact, declarationAccepted].some(
      (value) => value !== undefined
    );
    const isLocked =
      candidate.joiningForm.status === "submitted" && Boolean(candidate.joiningForm.lockedAt);

    if (isLocked && ((status && status !== "submitted") || restrictedUpdates)) {
      return res.status(409).json({ error: "Joining form is locked after submission." });
    }

    candidate.joiningForm = {
      ...candidate.joiningForm,
      status: status || candidate.joiningForm.status,
      submittedTo: submittedTo ?? candidate.joiningForm.submittedTo,
      submittedAt:
        status === "submitted" && !candidate.joiningForm.submittedAt
          ? new Date()
          : candidate.joiningForm.submittedAt,
      phone: phone ?? candidate.joiningForm.phone,
      address: address ?? candidate.joiningForm.address,
      emergencyContact: emergencyContact ?? candidate.joiningForm.emergencyContact,
      nonWorkerId: nonWorkerId ?? candidate.joiningForm.nonWorkerId,
      governmentId: governmentId ?? candidate.joiningForm.governmentId,
      declarationAccepted: declarationAccepted ?? candidate.joiningForm.declarationAccepted,
      aadhaarNumber: req.body.aadhaarNumber ?? candidate.joiningForm.aadhaarNumber,
      panCardNumber: req.body.panCardNumber ?? candidate.joiningForm.panCardNumber
    };

    candidate.timeline.push({
      stage: "Onboarding",
      note:
        status === "submitted"
          ? `Joining form submitted to ${submittedTo || "admin"}.`
          : "Joining form saved."
    });

    if (status === "submitted") {
      if (!candidate.joiningForm.lockedAt) {
        candidate.joiningForm.lockedAt = new Date();
      }
      candidate.accessProvisioning.status = "Pending";
      if (!candidate.sla.nonWorkerIdDueAt) {
        candidate.sla.nonWorkerIdDueAt = new Date(Date.now() + ONE_DAY_MS);
      }
      candidate.timeline.push({
        stage: "Access",
        note: "Non-Worker ID task triggered (SLA 1 business day)."
      });
    }

    if (candidate.joiningForm.nonWorkerId) {
      candidate.sla.nonWorkerIdStatus = "met";
    }

    await candidate.save();
    await createAuditEntry({
      action: "candidate.joiningForm.updated",
      metadata: { status: candidate.joiningForm.status },
      candidateId: candidate._id
    });

    if (status === "submitted") {
      await createNotificationEntry({
        type: "onboarding",
        subject: "Joining form submitted to Admin",
        body: `${candidate.name} submitted the joining form for onboarding to Admin.`,
        candidateId: candidate._id
      });
    }
    return res.json({ item: candidate });
  } catch (error) {
    next(error);
  }
};

export const updateNdaStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, signedAt } = req.body;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    candidate.nda.status = status || candidate.nda.status;
    if (status === "Issued") {
      candidate.nda.issuedAt = new Date();
      if (!candidate.sla.ndaDueAt) {
        const baseDate = candidate.internshipStartDate || Date.now() + ONE_DAY_MS;
        const dueAt = candidate.internshipStartDate
          ? new Date(new Date(candidate.internshipStartDate).getTime() - ONE_DAY_MS)
          : new Date(baseDate);
        candidate.sla.ndaDueAt = dueAt;
      }
    }

    if (status === "Signed") {
      candidate.nda.signedAt = new Date();
      candidate.ndaSignedAt = candidate.nda.signedAt;
      candidate.sla.ndaStatus = "met";
      candidate.status = "NDA";

      if (!candidate.joiningForm.nonWorkerId) {
        candidate.joiningForm.nonWorkerId = await generateNonWorkerId();
        candidate.timeline.push({
          stage: "Onboarding",
          note: `Non-Worker ID generated: ${candidate.joiningForm.nonWorkerId}.`
        });
        await createNotificationEntry({
          type: "onboarding",
          subject: "Non-Worker ID generated",
          body: `${candidate.name} has been assigned ${candidate.joiningForm.nonWorkerId} after NDA signing.`,
          candidateId: candidate._id
        });
      }
    }

    candidate.timeline.push({ stage: "NDA", note: `NDA ${status || "updated"}.` });
    await candidate.save();

    await createAuditEntry({
      action: "candidate.nda.updated",
      metadata: { status: candidate.nda.status },
      candidateId: candidate._id
    });
    if (status === "Signed") {
      await createNotificationEntry({
        type: "nda",
        subject: "NDA signed",
        body: `${candidate.name} completed NDA signing.`,
        candidateId: candidate._id
      });
    }
    return res.json({ item: candidate });
  } catch (error) {
    next(error);
  }
};

export const updateAccessProvisioning = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adAccount } = req.body;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    candidate.accessProvisioning.status = status || candidate.accessProvisioning.status;
    candidate.accessProvisioning.adAccount = adAccount || candidate.accessProvisioning.adAccount;
    if (status === "Provisioned") {
      candidate.accessProvisioning.provisionedAt = new Date();
      if (!candidate.joiningForm.submittedAt) {
        candidate.joiningForm.submittedAt = candidate.accessProvisioning.provisionedAt;
      }
    }
    if (status === "Deactivated") {
      candidate.accessProvisioning.deactivatedAt = new Date();
      candidate.sla.accessDeactivationStatus = "met";
    }
    candidate.timeline.push({ stage: "Access", note: "Access provisioning updated." });
    await candidate.save();

    await createAuditEntry({
      action: "candidate.access.updated",
      metadata: { status: candidate.accessProvisioning.status },
      candidateId: candidate._id
    });
    if (status === "Provisioned") {
      await createNotificationEntry({
        type: "access",
        subject: "Access provisioned",
        body: `${candidate.name} has been provisioned for onboarding access.`,
        candidateId: candidate._id
      });
    }
    if (status === "Deactivated") {
      await createNotificationEntry({
        type: "access",
        subject: "Access deactivated",
        body: `${candidate.name}'s access has been deactivated post-closure.`,
        candidateId: candidate._id
      });
    }
    return res.json({ item: candidate });
  } catch (error) {
    next(error);
  }
};

export const updateLifecycle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, extensionDate, closureDate } = req.body;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    if (startDate && candidate.nda?.status !== "Signed") {
      return res.status(400).json({ error: "NDA must be signed before start date." });
    }

    candidate.lifecycle = {
      ...candidate.lifecycle,
      startDate: startDate ? new Date(startDate) : candidate.lifecycle.startDate,
      endDate: endDate ? new Date(endDate) : candidate.lifecycle.endDate,
      extensionDate: extensionDate ? new Date(extensionDate) : candidate.lifecycle.extensionDate,
      closureDate: closureDate ? new Date(closureDate) : candidate.lifecycle.closureDate
    };

    if (startDate) {
      candidate.timeline.push({ stage: "Start", note: "Internship start confirmed." });
    }
    if (extensionDate) {
      candidate.timeline.push({ stage: "Extension", note: "Internship extended." });
    }

    if (closureDate) {
      candidate.status = "Completed";
      candidate.timeline.push({ stage: "Closure", note: "Internship closed." });
      candidate.sla.accessDeactivationDueAt = new Date(
        new Date(closureDate).getTime() + ONE_DAY_MS
      );
    }

    await candidate.save();
    await createAuditEntry({
      action: "candidate.lifecycle.updated",
      metadata: { closureDate: Boolean(closureDate) },
      candidateId: candidate._id
    });
    if (closureDate) {
      await createNotificationEntry({
        type: "closure",
        subject: "Internship completed",
        body: `${candidate.name}'s internship has been closed.`,
        candidateId: candidate._id
      });
    }
    return res.json({ item: candidate });
  } catch (error) {
    next(error);
  }
};

export const requestCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const issue = Boolean(req.body?.issue);
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    if (issue) {
      candidate.certificate.issuedAt = new Date();
      candidate.certificate.documentBody = buildCertificate(candidate);
      candidate.certificate.issuedBy = req.user?.email || "system";
      candidate.timeline.push({ stage: "Certificate", note: "Certificate issued." });
    } else {
      candidate.certificate.requestedAt = new Date();
      candidate.timeline.push({ stage: "Certificate", note: "Certificate requested." });
    }
    await candidate.save();

    await createAuditEntry({
      action: issue ? "candidate.certificate.issued" : "candidate.certificate.requested",
      candidateId: candidate._id
    });
    await createNotificationEntry({
      type: "certificate",
      subject: issue ? "Certificate issued" : "Certificate requested",
      body: issue
        ? `${candidate.name}'s completion certificate is ready.`
        : `${candidate.name} requested a completion certificate.`,
      candidateId: candidate._id
    });
    return res.json({ item: candidate });
  } catch (error) {
    next(error);
  }
};

export const generateCandidateLetter = async (req, res, next) => {
  try {
    const { id, type } = req.params;
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    let pdfBuffer;
    let fileName;

    if (type === "offer") {
      pdfBuffer = await generateOfferLetterPdf(candidate);
      fileName = `offer-letter-${candidate._id}.pdf`;

      try {
        await sendOfferLetterEmail(candidate.email, candidate.name, pdfBuffer, fileName);
      } catch (emailError) {
        console.warn("Failed to send offer letter email:", emailError.message);
      }

      candidate.joiningForm = candidate.joiningForm || {};
      candidate.joiningForm.generatedAt = new Date();
    } else if (type === "certificate") {
      pdfBuffer = await generateCertificatePdf(candidate, candidate.certificate?.documentBody);
      fileName = `certificate-${candidate._id}.pdf`;

      try {
        await sendCertificateEmail(candidate.email, candidate.name, pdfBuffer, fileName);
      } catch (emailError) {
        console.warn("Failed to send certificate email:", emailError.message);
      }

      candidate.certificate = candidate.certificate || {};
      candidate.certificate.issuedAt = new Date();
      candidate.certificate.issuedBy = req.user?.email || "system";
    } else if (type === "closure") {
      pdfBuffer = await generateClosureLetterPdf(candidate);
      fileName = `closure-letter-${candidate._id}.pdf`;

      candidate.lifecycle = candidate.lifecycle || {};
      candidate.lifecycle.closureDate = new Date();
    } else {
      return res.status(400).json({ error: "Invalid letter type." });
    }

    await candidate.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const seedDemoCandidates = async (req, res, next) => {
  try {
    const force = String(req.body?.force || req.query.force || "") === "true";
    const existingCount = await Candidate.countDocuments();

    if (existingCount > 0 && !force) {
      return res.json({
        message: "Candidates already exist. Use force=true to recreate demo data.",
        count: existingCount
      });
    }

    if (force) {
      await Candidate.deleteMany({});
    }

    const demoCandidates = [
      {
        name: "Aisha Khan",
        email: "aisha.khan@internflow.demo",
        phone: "555-0101",
        skills: ["React", "TypeScript", "Figma"],
        availability: "June 2026, 12 weeks",
        status: "Referral",
        score: 78,
        readinessExplanation: "Solid frontend foundation and strong communication.",
        timeline: [{ stage: "Referral", note: "Referred by design lead." }]
      },
      {
        name: "Rohan Mehta",
        email: "rohan.mehta@internflow.demo",
        phone: "555-0102",
        skills: ["Node.js", "MongoDB", "AWS"],
        availability: "May 2026, 10 weeks",
        status: "NDA",
        score: 84,
        readinessExplanation: "Backend stack experience with strong project exposure.",
        timeline: [
          { stage: "Referral", note: "Referred by engineering manager." },
          { stage: "NDA", note: "NDA issued for signing." }
        ]
      },
      {
        name: "Lila Park",
        email: "lila.park@internflow.demo",
        phone: "555-0103",
        skills: ["Python", "Data Analysis", "SQL"],
        availability: "July 2026, 8 weeks",
        status: "NDA",
        score: 72,
        readinessExplanation: "Analytical profile with good data fundamentals.",
        nda: { status: "Signed", signedAt: new Date() },
        ndaSignedAt: new Date(),
        timeline: [
          { stage: "Referral", note: "Referral completed." },
          { stage: "NDA", note: "NDA signed and logged." }
        ]
      },
      {
        name: "Marcus Chen",
        email: "marcus.chen@internflow.demo",
        phone: "555-0104",
        skills: ["Go", "Kubernetes", "CI/CD"],
        availability: "June 2026, 16 weeks",
        status: "Active",
        score: 91,
        readinessExplanation: "Strong systems background and execution velocity.",
        accessProvisioning: { status: "Provisioned", adAccount: "marcus.chen@company.com" },
        timeline: [
          { stage: "Referral", note: "Referred internally." },
          { stage: "NDA", note: "NDA signed." },
          { stage: "Access", note: "Access provisioned." }
        ]
      },
      {
        name: "Sara Patel",
        email: "sara.patel@internflow.demo",
        phone: "555-0105",
        skills: ["Product", "Research", "UX"],
        availability: "May 2026, 12 weeks",
        status: "Completed",
        score: 88,
        readinessExplanation: "Product mindset with polished stakeholder skills.",
        lifecycle: { startDate: new Date(), closureDate: new Date() },
        timeline: [
          { stage: "Referral", note: "Recommended by product lead." },
          { stage: "Closure", note: "Internship closed." }
        ]
      }
    ];

    const created = await Candidate.create(demoCandidates);
    const notifications = created.map((candidate) => ({
      type: "demo",
      channel: "email",
      status: "pending",
      recipient: candidate.email,
      subject: "Demo workflow update",
      body: `Workflow update recorded for ${candidate.name}.`,
      candidateId: candidate._id
    }));

    await Notification.insertMany(notifications);
    await createAuditEntry({
      action: "demo.seeded",
      metadata: { count: created.length }
    });

    return res.json({ items: created, message: "Demo data created." });
  } catch (error) {
    next(error);
  }
};
