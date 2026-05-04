const roles = [
  {
    id: "admin",
    label: "Program Admin",
    description: "Full workflow visibility"
  },
  {
    id: "hr",
    label: "HR",
    description: "Screening & onboarding"
  },
  {
    id: "it",
    label: "IT",
    description: "Access provisioning"
  },
  {
    id: "compliance",
    label: "Compliance",
    description: "NDA & audit"
  }
];

export default function RoleSwitcher({ activeRole, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs text-slate-300">
      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Role View</p>
      <div className="mt-3 grid gap-2">
        {roles.map((role) => {
          const isActive = role.id === activeRole;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onChange(role.id)}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                isActive
                  ? "border-emerald-400/80 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
              }`}
            >
              <span className="text-sm font-semibold">{role.label}</span>
              <span className="text-[11px] text-slate-500">{role.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
