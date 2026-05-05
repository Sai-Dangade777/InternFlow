import { NavLink } from "react-router-dom";

const roles = [
  {
    id: "admin",
    label: "Admin",
    description: "Full workflow visibility",
    to: "/admin/dashboard"
  },
  {
    id: "hr",
    label: "HR",
    description: "Screening & onboarding",
    to: "/hr/dashboard"
  },
  {
    id: "it",
    label: "IT",
    description: "Access provisioning",
    to: "/it/dashboard"
  },
  {
    id: "compliance",
    label: "Compliance",
    description: "NDA & audit",
    to: "/compliance/dashboard"
  }
];

export default function RoleSwitcher({ activeRole }) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs text-slate-300">
      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Role Entry Points</p>
      <div className="mt-3 grid gap-2">
        {roles.map((role) => {
          const isActive = role.id === activeRole;
          return (
            <NavLink
              key={role.id}
              to={role.to}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                isActive
                  ? "border-emerald-400/80 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
              }`}
            >
              <span className="text-sm font-semibold">{role.label}</span>
              <span className="text-[11px] text-slate-500">{role.description}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
