import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

const navigationByRole = {
  admin: [
    { to: "/admin/dashboard", label: "Overview" },
    { to: "/referrals", label: "Referral Intake" },
    { to: "/workflow", label: "Workflow & SLA" },
    { to: "/onboarding", label: "Onboarding" },
    { to: "/compliance", label: "Compliance & Audit" }
  ],
  hr: [
    { to: "/hr/dashboard", label: "HR Dashboard" },
    { to: "/referrals", label: "Referral Intake" },
    { to: "/workflow", label: "Workflow & SLA" },
    { to: "/onboarding", label: "Joining & Docs" },
    { to: "/compliance", label: "Compliance & Audit" }
  ],
  it: [
    { to: "/it/dashboard", label: "IT Dashboard" },
    { to: "/onboarding", label: "Provisioning" }
  ],
  compliance: [
    { to: "/compliance/dashboard", label: "Compliance Dashboard" },
    { to: "/compliance", label: "Audit Trail" }
  ],
  candidate: [
    { to: "/candidate/dashboard", label: "My Dashboard" },
    { to: "/onboarding", label: "Joining Form" }
  ]
};

const pageTitles = {
  admin: "Program Admin Console",
  hr: "HR Operations Console",
  it: "IT Provisioning Console",
  compliance: "Compliance Console",
  candidate: "Candidate Portal"
};

export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();
  const currentRole = user?.role || (location.pathname.startsWith("/hr")
    ? "hr"
    : location.pathname.startsWith("/it")
    ? "it"
    : location.pathname.startsWith("/compliance")
    ? "compliance"
    : location.pathname.startsWith("/candidate")
    ? "candidate"
    : "admin");

  const links = navigationByRole[currentRole] || navigationByRole.admin;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <header className="relative border-b border-slate-800/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-emerald-300/80">Intern Flow</p>
            <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
              {pageTitles[currentRole] || pageTitles.admin}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Role-specific workflow controls, candidate lifecycle tracking, and audit-safe automation.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-xs text-slate-300">
            Signed in as <span className="text-emerald-300">{currentRole}</span>
            <div className="mt-1 text-[11px] text-slate-500">{user?.email || "guest"}</div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[0.28fr_1fr]">
        <aside className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Navigation</p>
          <div className="mt-3 grid gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-emerald-400/80 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </aside>
        <section className="min-h-[70vh]">
          <Outlet context={{ role: currentRole }} />
        </section>
      </main>
    </div>
  );
}
