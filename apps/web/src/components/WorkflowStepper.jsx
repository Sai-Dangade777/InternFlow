const steps = [
  "Referral",
  "NDA",
  "Active",
  "Completed"
];

export default function WorkflowStepper({ currentStep, status }) {
  const resolvedStep =
    typeof currentStep === "number"
      ? currentStep
      : status
      ? Math.max(0, steps.indexOf(status))
      : 0;
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <h2 className="text-lg font-semibold">Workflow Status</h2>
      <p className="mt-1 text-sm text-slate-400">
        Track the internship pipeline at a glance.
      </p>
      <div className="mt-6 flex flex-col gap-5">
        {steps.map((step, index) => {
          const isActive = index === resolvedStep;
          const isComplete = index < resolvedStep;

          return (
            <div key={step} className="flex items-center gap-4">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full border transition-colors duration-300 ${
                    isComplete
                      ? "border-emerald-400/70 bg-emerald-400/20"
                      : isActive
                      ? "border-emerald-400 bg-emerald-400/20"
                      : "border-slate-700 bg-slate-950"
                  }`}
                />
                <span
                  className={`relative text-sm font-semibold ${
                    isComplete || isActive ? "text-emerald-300" : "text-slate-500"
                  }`}
                >
                  {index + 1}
                </span>
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium transition-colors ${
                    isComplete
                      ? "text-slate-300"
                      : isActive
                      ? "text-emerald-200"
                      : "text-slate-500"
                  }`}
                >
                  {step}
                </p>
                <div className="mt-2 h-1 rounded-full bg-slate-800">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      isComplete
                        ? "w-full bg-emerald-400"
                        : isActive
                        ? "w-1/2 bg-emerald-300"
                        : "w-0 bg-transparent"
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
