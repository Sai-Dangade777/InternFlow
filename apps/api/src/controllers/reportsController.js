import Candidate from "../models/Candidate.js";

const daysBetween = (start, end) =>
  Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));

const countStage = (candidates) =>
  candidates.reduce((acc, candidate) => {
    const status = candidate.status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

const countSlaBreaches = (candidates) => {
  const now = Date.now();
  return candidates.reduce(
    (acc, candidate) => {
      if (
        candidate.sla?.nonWorkerIdDueAt &&
        now > new Date(candidate.sla.nonWorkerIdDueAt).getTime() &&
        !candidate.joiningForm?.nonWorkerId
      ) {
        acc.nonWorkerId += 1;
      }
      if (
        candidate.sla?.ndaDueAt &&
        now > new Date(candidate.sla.ndaDueAt).getTime() &&
        candidate.nda?.status !== "Signed"
      ) {
        acc.nda += 1;
      }
      if (
        candidate.sla?.accessDeactivationDueAt &&
        now > new Date(candidate.sla.accessDeactivationDueAt).getTime() &&
        candidate.accessProvisioning?.status !== "Deactivated"
      ) {
        acc.accessDeactivation += 1;
      }
      return acc;
    },
    { nonWorkerId: 0, nda: 0, accessDeactivation: 0 }
  );
};

export const getComplianceMetrics = async (req, res, next) => {
  try {
    const candidates = await Candidate.find({}).lean();
    const cycleTimes = candidates
      .filter((candidate) => candidate.lifecycle?.startDate)
      .map((candidate) => daysBetween(candidate.createdAt, candidate.lifecycle.startDate));

    const avgCycle = cycleTimes.length
      ? Math.round(cycleTimes.reduce((sum, value) => sum + value, 0) / cycleTimes.length)
      : 0;

    const ndaBreaches = candidates.filter((candidate) => {
      if (!candidate.lifecycle?.startDate) {
        return false;
      }
      if (!candidate.nda?.signedAt) {
        return true;
      }
      return candidate.nda.signedAt > candidate.lifecycle.startDate;
    }).length;

    const completionRatio = candidates.length
      ? Math.round(
          (candidates.filter((candidate) => candidate.status === "Completed").length /
            candidates.length) *
            100
        )
      : 0;

    res.json({
      metrics: {
        stageCounts: countStage(candidates),
        averageCycleDays: avgCycle,
        ndaBreaches,
        completionRatio,
        slaBreaches: countSlaBreaches(candidates)
      }
    });
  } catch (error) {
    next(error);
  }
};
