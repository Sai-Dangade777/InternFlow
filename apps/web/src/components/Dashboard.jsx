import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../lib/api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import OnboardingPanel from "./OnboardingPanel.jsx";
import AccessPanel from "./AccessPanel.jsx";
import CertificatePanel from "./CertificatePanel.jsx";
import DocumentsPanel from "./DocumentsPanel.jsx";
import AuditTrail from "./AuditTrail.jsx";
import WorkflowStepper from "./WorkflowStepper.jsx";

const stageOrder = [
  "Referral",
  "HR Review",
  "Joining Form",
  "NDA",
  "Non-Worker ID",
  "Access Provisioning",
  "Internship Active",
  "Certificate",
  "Completed"
];

const roleActions = {
  admin: [
    "Review escalations",
    "Approve lifecycle changes",
    "Monitor audit integrity"
  ],
  hr: [
    "Review referrals",
    "Send NDA and offer letters",
    "Manage onboarding requests"
  ],
  it: [
    "Provision system access",
    "Validate account readiness",
    "Deactivate access on closure"
  ],
  compliance: [
    "Review NDA logs",
    "Audit lifecycle events",
    "Verify closure artifacts"
  ],
  candidate: [
    "Complete joining form",
    "Sign NDA",
    "Track internship milestones"
  ]
};

const roleFocus = {
  admin: "End-to-end oversight",
  hr: "Screening and onboarding",
  it: "Access provisioning",
  compliance: "NDA and audit trails",
  candidate: "Personal internship timeline"
};

const emptySummary = {
  total: 0,
  pending: 0,
  inProgress: 0,
  completed: 0,
  slaAtRisk: 0,
  slaBreaches: 0
};

const formatValue = (value) => value || "-";

const getWorkflowIndex = (candidate) => {
  if (!candidate) return 0;
  if (candidate.status === "Completed" || candidate.lifecycle?.closureDate) return 8;
  if (candidate.certificate?.issuedAt) return 7;
  if (candidate.lifecycle?.startDate || candidate.status === "Active") return 6;
  if (candidate.accessProvisioning?.status === "Provisioned") return 5;
  if (candidate.joiningForm?.nonWorkerId) return 4;
  if (candidate.nda?.signedAt || candidate.nda?.status === "Signed") return 3;
  if (candidate.joiningForm?.status === "submitted") return 2;
  if (candidate.status === "NDA") return 3;
  return 0;
};

export default function Dashboard({ role = "admin", mode = "overview" }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(emptySummary);
  const [candidates, setCandidates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [aiInsight, setAiInsight] = useState(null);
  const [aiInsightStatus, setAiInsightStatus] = useState("idle");
  const [aiInsightError, setAiInsightError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftedEmail, setDraftedEmail] = useState(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [complianceMetrics, setComplianceMetrics] = useState(null);

  const visibleCandidates = useMemo(() => {
    if (role === "candidate" && user?.email) {
      const ownCandidates = candidates.filter(
        (candidate) => candidate.email?.toLowerCase() === user.email.toLowerCase()
      );
      return ownCandidates.length ? ownCandidates : candidates.slice(0, 1);
    }
    return candidates;
  }, [candidates, role, user?.email]);

  const selectedCandidate = useMemo(
    () => visibleCandidates.find((candidate) => candidate._id === selectedId) || visibleCandidates[0] || null,
    [selectedId, visibleCandidates]
  );

  const currentStep = getWorkflowIndex(selectedCandidate);
  const nextStatus = stageOrder[currentStep + 1];
  const progressPercent = stageOrder.length > 1 ? (currentStep / (stageOrder.length - 1)) * 100 : 0;

  const loadCandidates = async () => {
    const [summaryResponse, candidateResponse] = await Promise.all([
      fetchJson("/candidates/summary"),
      fetchJson("/candidates")
    ]);
    setSummary(summaryResponse.summary || emptySummary);
    setCandidates(candidateResponse.items || []);
    const nextVisibleCandidates =
      role === "candidate" && user?.email
        ? (candidateResponse.items || []).filter(
            (candidate) => candidate.email?.toLowerCase() === user.email.toLowerCase()
          )
        : candidateResponse.items || [];
    if (!selectedId && nextVisibleCandidates.length) {
      setSelectedId(nextVisibleCandidates[0]._id);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await fetchJson("/notifications");
      setNotifications(response.items || []);
    } catch {
      setNotifications([]);
    }
  };

  const loadComplianceMetrics = async () => {
    try {
      const response = await fetchJson("/reports/metrics");
      setComplianceMetrics(response.metrics || null);
    } catch {
      setComplianceMetrics(null);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadCandidates();
        await loadNotifications();
        await loadComplianceMetrics();
      } catch {
        setCandidates([]);
        setSummary(emptySummary);
      }
    };

    run();
  }, [role, user?.email]);

  useEffect(() => {
    if (!selectedCandidate?._id) {
      return;
    }

    const loadSlaRisk = async () => {
      try {
        await fetchJson("/sla/risk", {
          method: "POST",
          body: JSON.stringify({
            ndaSignedAt: selectedCandidate.ndaSignedAt || selectedCandidate.nda?.signedAt,
            referralCreatedAt: selectedCandidate.createdAt,
            hrReviewed: Boolean(selectedCandidate.hrReviewedAt)
          })
        });
      } catch {
        // best-effort only
      }
    };

    loadSlaRisk();
  }, [selectedCandidate]);

  const handleGenerateInsight = async () => {
    if (!selectedCandidate) return;
    setIsGenerating(true);
    setAiInsightStatus("loading");
    setAiInsightError("");
    try {
      const response = await fetchJson("/ai/insight", {
        method: "POST",
        body: JSON.stringify({ candidateId: selectedCandidate._id })
      });
      setAiInsight(response.data || null);
      setAiInsightStatus(response.data ? "ready" : "empty");
    } catch {
      setAiInsight(null);
      setAiInsightStatus("error");
      setAiInsightError("AI insight generation is unavailable right now.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDraftEmail = async (type) => {
    if (!selectedCandidate) return;
    setIsDrafting(true);
    try {
      const response = await fetchJson("/ai/draft-email", {
        method: "POST",
        body: JSON.stringify({ type, candidate: selectedCandidate })
      });
      setDraftedEmail(response.data || null);
    } catch {
      setDraftedEmail({
        subject: "Draft unavailable",
        body: "AI drafting is offline. Please use the standard templates."
      });
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await fetchJson("/candidates/demo-seed", { method: "POST" });
      await loadCandidates();
      await loadNotifications();
      await loadComplianceMetrics();
    } catch {
      // optional action
    } finally {
      setIsSeeding(false);
    }
  };

  const handleAdvanceStatus = async () => {
    if (!selectedCandidate || !nextStatus) return;
    setIsUpdatingStatus(true);
    try {
      const response = await fetchJson(`/candidates/${selectedCandidate._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus, note: `Advanced to ${nextStatus}.` })
      });
      const updated = response.item;
      setCandidates((previous) =>
        previous.map((candidate) => (candidate._id === updated._id ? updated : candidate))
      );
      setSelectedId(updated._id);
      await loadNotifications();
    } catch {
      // keep the dashboard responsive
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      const response = await fetchJson(`/notifications/${id}/ack`, { method: "PATCH" });
      setNotifications((previous) => previous.map((item) => (item._id === id ? response.item : item)));
    } catch {
      // no-op
    }
  };

  const showOverview = mode === "overview";
  const showWorkflow = mode === "workflow" || mode === "candidate";
  const showOperations = mode === "operations" || mode === "candidate";
  const showCompliance = mode === "compliance" || role === "compliance";
  const showAccessSection = role === "admin" || role === "it";
  const showHrCommunications = role === "admin" || role === "hr";

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Operational Dashboard</h2>
          <p className="mt-1 text-sm text-slate-400">Pipeline analytics, workflow control, and AI-assisted readiness.</p>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-emerald-300/70">
            {role} • {roleFocus[role] || roleFocus.admin}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
            onClick={handleGenerateInsight}
            type="button"
            disabled={isGenerating || !selectedCandidate}
          >
            {isGenerating ? "Generating insight..." : "Generate AI insight"}
          </button>
          {role === "admin" ? (
            <button
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600"
              onClick={handleSeedDemo}
              type="button"
              disabled={isSeeding}
            >
              {isSeeding ? "Seeding demo data..." : "Create demo data"}
            </button>
          ) : null}
        </div>
      </div>

      {showOverview ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total candidates", value: summary.total },
            { label: "Pending", value: summary.pending },
            { label: "In progress", value: summary.inProgress },
            { label: "Completed", value: summary.completed }
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">{card.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {selectedCandidate ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Selected Candidate</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-100">{selectedCandidate.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">Stage: {selectedCandidate.status || "Referral"}</p>
                </div>
                {role !== "candidate" ? (
                  <select
                    className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-300"
                    value={selectedId}
                    onChange={(event) => setSelectedId(event.target.value)}
                  >
                    {visibleCandidates.map((candidate) => (
                      <option key={candidate._id} value={candidate._id}>
                        {candidate.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm">
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Phone</p>
                  <p className="mt-1 text-slate-100">{formatValue(selectedCandidate.phone || selectedCandidate.joiningForm?.phone)}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Address</p>
                  <p className="mt-1 text-slate-100">{formatValue(selectedCandidate.joiningForm?.address)}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Emergency Contact</p>
                  <p className="mt-1 text-slate-100">{formatValue(selectedCandidate.joiningForm?.emergencyContact)}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Aadhaar</p>
                  <p className="mt-1 text-slate-100">{formatValue(selectedCandidate.joiningForm?.aadhaarNumber)}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">PAN</p>
                  <p className="mt-1 text-slate-100">{formatValue(selectedCandidate.joiningForm?.panCardNumber)}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Government ID</p>
                  <p className="mt-1 text-slate-100">{formatValue(selectedCandidate.joiningForm?.governmentId)}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">NDA Status</p>
                  <p className="mt-1 text-slate-100">{formatValue(selectedCandidate.nda?.status || "Not Issued")}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Non-Worker ID</p>
                  <p className="mt-1 text-slate-100">{formatValue(selectedCandidate.joiningForm?.nonWorkerId)}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Workflow Stage</p>
                  <p className="mt-1 text-slate-100">{stageOrder[currentStep]}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="text-xs text-slate-400">{Math.round(progressPercent)}%</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-full border border-emerald-500/70 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200"
                  onClick={handleAdvanceStatus}
                  disabled={!nextStatus || isUpdatingStatus || role === "candidate"}
                >
                  {isUpdatingStatus ? "Updating status..." : nextStatus ? `Advance to ${nextStatus}` : "Workflow complete"}
                </button>
                {showHrCommunications ? (
                  <button
                    type="button"
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300"
                    onClick={() => handleDraftEmail("mentor-intro")}
                    disabled={isDrafting}
                  >
                    {isDrafting ? "Drafting..." : "Draft mail template"}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {showWorkflow ? <WorkflowStepper status={stageOrder[currentStep]} currentStep={currentStep} /> : null}
          {selectedCandidate ? <AuditTrail candidate={selectedCandidate} /> : null}
        </div>

        <div className="space-y-6">
          {showOperations && role !== "candidate" ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">AI Insight</p>
              <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200">
                {aiInsightStatus === "loading" ? (
                  <p>Generating insight...</p>
                ) : aiInsightStatus === "error" ? (
                  <p className="text-rose-300">{aiInsightError}</p>
                ) : aiInsight ? (
                  <div className="space-y-3">
                    <p>Score {aiInsight.score}: {aiInsight.explanation}</p>
                    {aiInsight.nextSteps?.length ? (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-sky-300/70">Next steps</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-400">
                          {aiInsight.nextSteps.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                    ) : null}
                    {aiInsight.risks?.length ? (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-amber-300/70">Risks</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-400">
                          {aiInsight.risks.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p>Generate an insight to surface readiness risks and next steps.</p>
                )}
              </div>
            </div>
          ) : null}

              {showAccessSection ? <AccessPanel candidate={selectedCandidate} onUpdated={() => loadCandidates()} /> : null}
          {showHrCommunications ? (
            <>
              <DocumentsPanel candidate={selectedCandidate} onUpdated={() => loadCandidates()} />
              <CertificatePanel candidate={selectedCandidate} onUpdated={() => loadCandidates()} />
            </>
          ) : null}
          {role === "candidate" ? <OnboardingPanel candidate={selectedCandidate} onUpdated={() => loadCandidates()} /> : null}
          {showOperations && role !== "candidate" ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">AI Drafted Email</p>
              <div className="mt-3 text-xs text-slate-300">
                {draftedEmail ? (
                  <>
                    <p className="text-slate-200">{draftedEmail.subject}</p>
                    <p className="mt-2 whitespace-pre-line text-slate-400">{draftedEmail.body}</p>
                  </>
                ) : (
                  <p className="text-slate-400">Generate a draft to share.</p>
                )}
              </div>
            </div>
          ) : null}

          {showCompliance ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Compliance Metrics</p>
              <div className="mt-4 grid gap-3 text-xs text-slate-300">
                <div className="flex items-center justify-between"><span>Average cycle time</span><span className="text-slate-200">{complianceMetrics?.averageCycleDays ?? "-"} days</span></div>
                <div className="flex items-center justify-between"><span>NDA breaches</span><span className="text-amber-300">{complianceMetrics?.ndaBreaches ?? "-"}</span></div>
                <div className="flex items-center justify-between"><span>Completion ratio</span><span className="text-emerald-300">{complianceMetrics?.completionRatio ?? "-"}%</span></div>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Notifications</p>
            <div className="mt-4 space-y-3 text-xs text-slate-300">
              {notifications.length ? notifications.slice(0, 5).map((item) => (
                <div key={item._id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-200">{item.subject || "Notification"}</p>
                    <p className="text-xs text-slate-500">{item.body || ""}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-slate-700 px-3 py-1 text-[10px] text-slate-300"
                    onClick={() => handleAcknowledge(item._id)}
                  >
                    Acknowledge
                  </button>
                </div>
              )) : <p className="text-xs text-slate-500">No notifications yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
