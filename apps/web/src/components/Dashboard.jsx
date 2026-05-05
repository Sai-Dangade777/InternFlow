import { useEffect, useMemo, useState } from "react";
import { fetchExternalCandidates, fetchJson } from "../lib/api.js";
import OnboardingPanel from "./OnboardingPanel.jsx";
import AccessPanel from "./AccessPanel.jsx";
import NdaPanel from "./NdaPanel.jsx";
import CertificatePanel from "./CertificatePanel.jsx";
import DocumentsPanel from "./DocumentsPanel.jsx";
import AuditTrail from "./AuditTrail.jsx";
import WorkflowStepper from "./WorkflowStepper.jsx";

const statusStyles = {
  Referral: "bg-slate-800 text-slate-300",
  NDA: "bg-amber-500/10 text-amber-300",
  Active: "bg-emerald-500/10 text-emerald-300",
  Completed: "bg-purple-500/10 text-purple-300"
};

const fallbackCandidates = [
  { name: "Aisha Khan", status: "Referral", score: 78 },
  { name: "Rohan Mehta", status: "NDA", score: 84 },
  { name: "Lila Park", status: "NDA", score: 72 },
  { name: "Marcus Chen", status: "Active", score: 91 },
  { name: "Sara Patel", status: "Completed", score: 88 }
];

const fallbackSummary = {
  total: 42,
  pending: 12,
  inProgress: 18,
  completed: 12
};

const rolePanels = {
  admin: {
    label: "Program Admin",
    focus: "End-to-end oversight"
  },
  hr: {
    label: "HR",
    focus: "Screening and onboarding"
  },
  it: {
    label: "IT",
    focus: "Access provisioning"
  },
  compliance: {
    label: "Compliance",
    focus: "NDA and audit trails"
  }
};

const roleActions = {
  admin: [
    "Review SLA escalations",
    "Approve onboarding batches",
    "Export audit trail"
  ],
  hr: ["Verify documents", "Schedule interview", "Issue onboarding email"],
  it: ["Provision email", "Grant repo access", "Confirm tool licenses"],
  compliance: ["Verify NDA status", "Check background docs", "Archive closure pack"]
};

const statusSteps = ["Referral", "NDA", "Active", "Completed"]; 

export default function Dashboard({ role = "admin", mode = "overview" }) {
  const [summary, setSummary] = useState(fallbackSummary);
  const [candidates, setCandidates] = useState(fallbackCandidates);
  const [notifications, setNotifications] = useState([]);
  const [aiInsight, setAiInsight] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftedEmail, setDraftedEmail] = useState(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [complianceMetrics, setComplianceMetrics] = useState(null);
  const roleMeta = rolePanels[role] || rolePanels.admin;
  const [selectedId, setSelectedId] = useState("");
  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate._id === selectedId) || candidates[0],
    [candidates, selectedId]
  );
  const [slaRisk, setSlaRisk] = useState({ riskLevel: "LOW", reason: "" });

  const loadNotifications = async () => {
    try {
      const response = await fetchJson("/notifications");
      setNotifications(response.items || []);
    } catch (error) {
      setNotifications([]);
    }
  };

  const loadComplianceMetrics = async () => {
    try {
      const response = await fetchJson("/reports/metrics");
      setComplianceMetrics(response.metrics || null);
    } catch (error) {
      setComplianceMetrics(null);
    }
  };

  const refreshCandidates = async (nextSelectedId) => {
    try {
      const [summaryResponse, candidateResponse] = await Promise.all([
        fetchJson("/candidates/summary"),
        fetchJson("/candidates")
      ]);
      setSummary(summaryResponse.summary);
      setCandidates(candidateResponse.items || []);
      if (nextSelectedId) {
        setSelectedId(nextSelectedId);
      } else if (candidateResponse.items?.length) {
        setSelectedId(candidateResponse.items[0]._id);
      }
    } catch (error) {
      // Keep current data if refresh fails.
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const summaryResponse = await fetchJson("/candidates/summary");
        const candidateResponse = await fetchJson("/candidates");
        setSummary(summaryResponse.summary);
        setCandidates(candidateResponse.items || []);
        if (!selectedId && candidateResponse.items?.length) {
          setSelectedId(candidateResponse.items[0]._id);
        }
        await loadNotifications();
        await loadComplianceMetrics();
      } catch (error) {
        try {
          const externalUsers = await fetchExternalCandidates();
          const statuses = ["Referral", "NDA", "Active", "Completed"];
          const mapped = externalUsers.map((user, index) => ({
            _id: `external-${user.id}`,
            name: user.name,
            status: statuses[index % statuses.length],
            score: 70 + (user.id % 25)
          }));
          setCandidates(mapped);
          setSummary({
            total: mapped.length,
            pending: mapped.filter((item) => item.status !== "Active" && item.status !== "Completed").length,
            inProgress: mapped.filter((item) => item.status === "Active").length,
            completed: mapped.filter((item) => item.status === "Completed").length
          });
          if (mapped.length) {
            setSelectedId(mapped[0]._id);
          }
          await loadComplianceMetrics();
        } catch (fallbackError) {
          // Keep hardcoded fallback data when external API is unavailable.
        }
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadSlaRisk = async () => {
      if (!selectedCandidate?._id) {
        return;
      }

      try {
        const response = await fetchJson("/sla/risk", {
          method: "POST",
          body: JSON.stringify({
            ndaSignedAt: selectedCandidate.ndaSignedAt,
            referralCreatedAt: selectedCandidate.createdAt,
            hrReviewed: Boolean(selectedCandidate.hrReviewedAt)
          })
        });
        setSlaRisk(response);
      } catch (error) {
        setSlaRisk({ riskLevel: "MEDIUM", reason: "SLA risk monitor unavailable." });
      }
    };

    loadSlaRisk();
  }, [selectedCandidate]);

  const handleGenerateInsight = async () => {
    setIsGenerating(true);
    try {
      const response = await fetchJson("/ai/evaluate", {
        method: "POST",
        body: JSON.stringify({
          skills: selectedCandidate?.skills || [],
          education: selectedCandidate?.education || [],
          availability: selectedCandidate?.availability || ""
        })
      });
      setAiInsight(response.data);
    } catch (error) {
      setAiInsight({
        score: 82,
        explanation: "AI service unavailable. Showing cached insight for demo." 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDraftEmail = async (type) => {
    if (!selectedCandidate) {
      return;
    }
    setIsDrafting(true);
    try {
      const response = await fetchJson("/ai/draft-email", {
        method: "POST",
        body: JSON.stringify({
          type,
          candidate: selectedCandidate
        })
      });
      setDraftedEmail(response.data);
    } catch (error) {
      setDraftedEmail({
        subject: "Draft unavailable",
        body: "AI drafting is offline. Please use the standard templates."
      });
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCandidateUpdated = async (updatedCandidate) => {
    if (!updatedCandidate) {
      return;
    }
    setCandidates((previous) =>
      previous.map((candidate) =>
        candidate._id === updatedCandidate._id ? updatedCandidate : candidate
      )
    );
    setSelectedId(updatedCandidate._id);
    try {
      const summaryResponse = await fetchJson("/candidates/summary");
      setSummary(summaryResponse.summary);
    } catch (error) {
      // Summary refresh is best-effort.
    }
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await fetchJson("/candidates/demo-seed", { method: "POST" });
      await refreshCandidates();
      await loadNotifications();
    } catch (error) {
      // Demo seed is optional; keep UI responsive.
    } finally {
      setIsSeeding(false);
    }
  };

  const handleAdvanceStatus = async () => {
    if (!selectedCandidate?._id) {
      return;
    }
    const currentIndex = statusSteps.indexOf(
      selectedCandidate.status === "HR Review" ? "NDA" : selectedCandidate.status || statusSteps[0]
    );
    const nextStatus = statusSteps[currentIndex + 1];
    if (!nextStatus) {
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const response = await fetchJson(`/candidates/${selectedCandidate._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          note: `Advanced to ${nextStatus}.`
        })
      });
      await handleCandidateUpdated(response.item);
      await loadNotifications();
    } catch (error) {
      // Ignore status update errors for demo resilience.
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      const response = await fetchJson(`/notifications/${id}/ack`, {
        method: "PATCH"
      });
      setNotifications((previous) =>
        previous.map((item) => (item._id === id ? response.item : item))
      );
    } catch (error) {
      // Keep notification list as-is on failure.
    }
  };

  const currentStep = Math.max(
    0,
    statusSteps.indexOf(selectedCandidate?.status === "HR Review" ? "NDA" : selectedCandidate?.status || statusSteps[0])
  );
  const nextStatus = statusSteps[currentStep + 1];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Operational Dashboard</h2>
          <p className="mt-1 text-sm text-slate-400">
            Pipeline analytics, SLA signals, and AI-assisted readiness.
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-emerald-300/70">
            {roleMeta.label} • {roleMeta.focus}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
            onClick={handleGenerateInsight}
            type="button"
            disabled={isGenerating}
          >
            {isGenerating ? "Generating insight..." : "Generate AI insight"}
          </button>
          {mode === "overview" ? (
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

        {mode === "overview" ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total candidates", value: summary.total },
              { label: "Pending", value: summary.pending },
              { label: "In progress", value: summary.inProgress },
              { label: "Completed", value: summary.completed },
              { label: "SLA at risk", value: summary.slaAtRisk ?? "-" },
              { label: "SLA breaches", value: summary.slaBreaches ?? "-" }
            ].map((card) => (
              <div
                key={card.label}
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-4"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {mode === "overview" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Candidates</p>
            <select
              className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-300"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {candidates.map((candidate) => (
                <option key={candidate._id || candidate.name} value={candidate._id || ""}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </div>
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40">
              {candidates.map((candidate) => (
                <tr key={candidate._id || candidate.name}>
                  <td className="px-4 py-3 text-sm text-slate-100">
                    {candidate.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        statusStyles[candidate.status] ||
                        "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {candidate.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-200">
                    {candidate.score ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">AI Summary</p>
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-200">
              {aiInsight
                ? `Score ${aiInsight.score}: ${aiInsight.explanation}`
                : "Generate an insight to surface readiness risks and next steps."}
            </p>
            {selectedCandidate?.readinessExplanation ? (
              <p className="mt-3 text-xs text-slate-400">
                Candidate readiness: {selectedCandidate.readinessExplanation}
              </p>
            ) : null}
          </div>
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-slate-500">AI Drafted Email</p>
              <button
                type="button"
                className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-300"
                onClick={() => handleDraftEmail("intro")}
                disabled={isDrafting}
              >
                {isDrafting ? "Drafting..." : "Draft communication"}
              </button>
            </div>
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
          <div className="mt-4 space-y-3 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span>Automation: NDA reminders</span>
              <span className="text-emerald-300">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Compliance checks</span>
              <span className="text-emerald-300">Synced</span>
            </div>
            <div className="flex items-center justify-between">
              <span>SLA risk monitor</span>
              <span className="text-amber-300">Medium</span>
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Role Actions</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              {(roleActions[role] || roleActions.admin).map((action) => (
                <li key={action} className="flex items-center justify-between">
                  <span>{action}</span>
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-400">
                    Pending
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      ) : null}

      {mode === "operations" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <OnboardingPanel candidate={selectedCandidate} onUpdated={handleCandidateUpdated} />
          <div className="grid gap-4">
            <NdaPanel candidate={selectedCandidate} onUpdated={handleCandidateUpdated} />
            <AccessPanel candidate={selectedCandidate} onUpdated={handleCandidateUpdated} />
            <CertificatePanel candidate={selectedCandidate} onUpdated={handleCandidateUpdated} />
            <DocumentsPanel candidate={selectedCandidate} onUpdated={handleCandidateUpdated} />
          </div>
        </div>
      ) : null}

      {mode === "workflow" ? (
        (role === "admin" || role === "hr") ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Selected Candidate</p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {selectedCandidate?.name || "Choose a candidate"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Status: {selectedCandidate?.status || "Referral"}
                  </p>
                </div>
                <select
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-300"
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                >
                  {candidates.map((candidate) => (
                    <option key={candidate._id || candidate.name} value={candidate._id || ""}>
                      {candidate.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="mt-4 rounded-full border border-emerald-500/70 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200"
                onClick={handleAdvanceStatus}
                disabled={!nextStatus || isUpdatingStatus}
              >
                {isUpdatingStatus
                  ? "Updating status..."
                  : nextStatus
                  ? `Advance to ${nextStatus}`
                  : "Workflow complete"}
              </button>
            </div>
            <AuditTrail candidate={selectedCandidate} />
          </div>
          <WorkflowStepper status={selectedCandidate?.status} currentStep={currentStep} />
        </div>
        ) : (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-300">Workflow & SLA views are visible to HR and Program Admin only.</p>
          </div>
        )
      ) : null} 

      {mode === "compliance" ? (
        (role === "admin" || role === "hr") ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Compliance Metrics</p>
              <div className="mt-4 grid gap-3 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Average cycle time</span>
                  <span className="text-slate-200">
                    {complianceMetrics?.averageCycleDays ?? "-"} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>NDA breaches</span>
                  <span className="text-amber-300">
                    {complianceMetrics?.ndaBreaches ?? "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Completion ratio</span>
                  <span className="text-emerald-300">
                    {complianceMetrics?.completionRatio ?? "-"}%
                  </span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-[11px] text-slate-400">
                  SLA breaches: Non-Worker ID{" "}
                  {complianceMetrics?.slaBreaches?.nonWorkerId ?? "-"}, NDA{" "}
                  {complianceMetrics?.slaBreaches?.nda ?? "-"}, Deactivation{" "}
                  {complianceMetrics?.slaBreaches?.accessDeactivation ?? "-"}
                </div>
              </div>
            </div>
            <AuditTrail candidate={selectedCandidate} />
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Notifications</p>
              <div className="mt-4 space-y-3 text-xs text-slate-300">
                {notifications.length ? (
                  notifications.slice(0, 5).map((item) => (
                    <div key={item._id} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-200">{item.subject || "Notification"}</p>
                        <p className="text-xs text-slate-500">{item.body || ""}</p>
                      </div>
                      <button
                        type="button"
                        className="rounded-full border border-slate-700 px-3 py-1 text-[10px] text-slate-300"
                        onClick={() => handleAcknowledge(item._id)}
                        disabled={item.status === "sent"}
                      >
                        {item.status === "sent" ? "Sent" : "Acknowledge"}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No notifications yet.</p>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Workflow SLA</p>
            <p className="mt-3 text-sm text-slate-300">
              Track Non-Worker ID, NDA, and access provisioning against SLA targets.
            </p>
            <div className="mt-4 space-y-3 text-xs text-slate-400">
              {selectedCandidate?.slaStatus?.items?.length ? (
                selectedCandidate.slaStatus.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <span
                      className={
                        item.status === "breach"
                          ? "text-rose-300"
                          : item.status === "pending"
                          ? "text-amber-300"
                          : item.status === "met"
                          ? "text-emerald-300"
                          : "text-slate-300"
                      }
                    >
                      {item.status} {item.dueAt ? `· due ${new Date(item.dueAt).toLocaleDateString()}` : ""}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span>Non-Worker ID SLA</span>
                    <span className="text-emerald-300">Within 1 business day</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>NDA signed before start</span>
                    <span className="text-amber-300">Monitor</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>AD deactivation</span>
                    <span className="text-slate-300">24h post end</span>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-xs text-slate-400">SLA risk level</p>
              <p className="mt-1 text-sm text-slate-200">
                {slaRisk.riskLevel}: {slaRisk.reason || "No SLA breaches detected."}
              </p>
            </div>
          </div>
        </div>
        ) : (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-300">Workflow & SLA views are visible to HR and Program Admin only.</p>
          </div>
        )
      ) : null} 
    </section>
  );
}
