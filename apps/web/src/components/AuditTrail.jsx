export default function AuditTrail({ candidate }) {
  const timeline = candidate?.timeline || [];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">Audit Trail</p>
      <div className="mt-4 space-y-3 text-xs text-slate-300">
        {timeline.length ? (
          timeline.map((event, index) => (
            <div key={`${event.stage}-${index}`} className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
              <div>
                <p className="text-sm text-slate-200">{event.stage}</p>
                <p className="text-xs text-slate-500">{event.note || "Event recorded"}</p>
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
