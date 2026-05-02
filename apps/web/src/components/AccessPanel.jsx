import { fetchJson } from "../lib/api.js";

export default function AccessPanel({ candidate, onUpdated }) {
  const handleProvision = async () => {
    if (!candidate) {
      return;
    }

    const response = await fetchJson(`/candidates/${candidate._id}/access`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "Provisioned",
        adAccount: `${candidate.name.replace(/\s+/g, ".").toLowerCase()}@company.com`
      })
    });
    onUpdated?.(response.item);
  };

  const handleDeactivate = async () => {
    if (!candidate) {
      return;
    }

    const response = await fetchJson(`/candidates/${candidate._id}/access`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "Deactivated",
        adAccount: candidate.accessProvisioning?.adAccount || ""
      })
    });
    onUpdated?.(response.item);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">Access Provisioning</p>
      <p className="mt-3 text-sm text-slate-300">
        Status: {candidate?.accessProvisioning?.status || "Pending"}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300"
          onClick={handleProvision}
          disabled={!candidate}
        >
          Mark access provisioned
        </button>
        <button
          type="button"
          className="rounded-full border border-rose-400/60 bg-rose-500/10 px-4 py-2 text-xs text-rose-200"
          onClick={handleDeactivate}
          disabled={!candidate || !candidate?.lifecycle?.closureDate}
        >
          Deactivate access
        </button>
      </div>
    </div>
  );
}
