import { fetchJson } from "../lib/api.js";

export default function CertificatePanel({ candidate, onUpdated }) {
  const requestCertificate = async () => {
    if (!candidate) {
      return;
    }

    const response = await fetchJson(`/candidates/${candidate._id}/certificate`, {
      method: "PATCH"
    });
    onUpdated?.(response.item);
  };

  const issueCertificate = async () => {
    if (!candidate) {
      return;
    }

    const response = await fetchJson(`/candidates/${candidate._id}/certificate`, {
      method: "PATCH",
      body: JSON.stringify({ issue: true })
    });
    onUpdated?.(response.item);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">Certificate</p>
      <p className="mt-3 text-sm text-slate-300">
        Requested: {candidate?.certificate?.requestedAt ? "Yes" : "No"} · Issued:{" "}
        {candidate?.certificate?.issuedAt ? "Yes" : "No"}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300"
          onClick={requestCertificate}
          disabled={!candidate}
        >
          Request certificate
        </button>
        <button
          type="button"
          className="rounded-full border border-emerald-500/70 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200"
          onClick={issueCertificate}
          disabled={!candidate}
        >
          Issue certificate
        </button>
      </div>
      {candidate?.certificate?.documentBody ? (
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300 whitespace-pre-line">
          {candidate.certificate.documentBody}
        </div>
      ) : null}
    </div>
  );
}
