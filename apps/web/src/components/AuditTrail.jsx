export default function AuditTrail({ candidate }) {
  const timeline = candidate?.timeline || [];
  const keyDates = [
    { label: "Referral created", date: candidate?.createdAt },
    { label: "NDA signed", date: candidate?.ndaSignedAt },
    { label: "Joining form submitted", date: candidate?.joiningForm?.submittedAt },
    { label: "Access provisioned", date: candidate?.accessProvisioning?.provisionedAt },
    { label: "Certificate issued", date: candidate?.certificate?.issuedAt }
  ].filter((d) => d.date);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">Audit Trail</p>
      <div className="mt-3 text-xs text-slate-400">
        {keyDates.length ? (
          <div className="mb-3">
            {keyDates.map((k) => (
              <div key={k.label} className="flex items-center justify-between">
                <span>{k.label}</span>
                <span className="text-slate-200">{new Date(k.date).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-4 space-y-3 text-xs text-slate-300">
        {timeline.length ? (
          timeline.map((event, index) => (
            <div key={`${event.stage}-${index}`} className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
              <div>
                <p className="text-sm text-slate-200">{event.stage}</p>
                <p className="text-xs text-slate-500">{event.note || "Event recorded"}</p>
                {event.at || event.date || event.createdAt ? (
                  <p className="text-[11px] text-slate-500 mt-1">{new Date(event.at || event.date || event.createdAt).toLocaleString()}</p>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500">No events recorded yet.</p>
        )}
      </div>
    </div>
  );
}
