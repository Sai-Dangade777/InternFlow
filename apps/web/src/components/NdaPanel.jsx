import { fetchJson } from "../lib/api.js";

export default function NdaPanel({ candidate, onUpdated }) {
  const issueNda = async () => {
    if (!candidate) {
      return;
    }

    const response = await fetchJson(`/candidates/${candidate._id}/nda`, {
      method: "PATCH",
      body: JSON.stringify({ status: "Issued" })
    });
    onUpdated?.(response.item);
  };

  const markSigned = async () => {
    if (!candidate) {
      return;
    }

    const response = await fetchJson(`/candidates/${candidate._id}/nda`, {
      method: "PATCH",
      body: JSON.stringify({ status: "Signed" })
    });
    onUpdated?.(response.item);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">NDA Status</p>
      <p className="mt-3 text-sm text-slate-300">
        Current: {candidate?.nda?.status || "Not Issued"}
      </p>
      {candidate?.sla?.ndaDueAt ? (
        <p className="mt-2 text-xs text-slate-400">
          NDA due by {new Date(candidate.sla.ndaDueAt).toLocaleDateString()}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300"
          onClick={issueNda}
          disabled={!candidate}
        >
          Issue NDA
        </button>
        <button
          type="button"
          className="rounded-full border border-emerald-500/70 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200"
          onClick={markSigned}
          disabled={!candidate}
        >
          Mark signed
        </button>
      </div>
    </div>
  );
}
