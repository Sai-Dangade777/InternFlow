import { NavLink, Outlet, useLocation } from "react-router-dom";
import RoleSwitcher from "../components/RoleSwitcher.jsx";

const links = [
  { to: "/", label: "Overview" },
  { to: "/referrals", label: "Referral Intake" },
  { to: "/workflow", label: "Workflow & SLA" },
  { to: "/onboarding", label: "Onboarding" },
  { to: "/compliance", label: "Compliance & Audit" }
];

export default function Layout() {
  const location = useLocation();
  const currentRole =
    location.pathname.startsWith("/hr")
      ? "hr"
      : location.pathname.startsWith("/it")
      ? "it"
      : location.pathname.startsWith("/compliance")
      ? "compliance"
      : "admin";

  const visibleLinks = links.filter((link) => {
    if (link.to === "/workflow") {
      return currentRole === "admin" || currentRole === "hr";
    }
    if (link.to === "/compliance") {
      return currentRole === "admin" || currentRole === "hr" || currentRole === "compliance";
    }
    return true;
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <header className="relative border-b border-slate-800/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-emerald-300/80">
              Intern Flow
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
              Internship Command Center
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Centralize referrals, automate compliance, and keep every stakeholder aligned with
              AI-assisted workflow intelligence.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-xs text-slate-300">
              Live build: Hackathon MVP
              <div className="mt-1 text-[11px] text-emerald-300/80">API + GenAI ready</div>
            </div>
            <RoleSwitcher activeRole={currentRole} />
          </div>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.28fr_1fr]">
        <aside className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Sections</p>
          <div className="mt-3 grid gap-2">
            {visibleLinks.map((link) => {
              const target = link.to === "/" ? `/${currentRole}/dashboard` : link.to;
              return (
              <NavLink
                key={link.to}
                to={target}
                className={({ isActive }) =>
                  `rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-emerald-400/80 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                  }`
                }
                end
              >
                {link.label}
              </NavLink>
              );
            })}
          </div>
        </aside>
        <section className="min-h-[70vh]">
          <Outlet context={{ role: currentRole }} />
        </section>
      </main>
    </div>
  );
}
