const projectPillars = [
  "Next.js + TypeScript foundation",
  "Supabase-ready storage and cache layer",
  "Gemini-powered research pipeline",
  "Daily automated refresh via GitHub Actions",
  "Telegram briefing support",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:px-10">
      <section className="rounded-3xl border border-emerald-500/20 bg-slate-950/70 p-8 shadow-2xl shadow-emerald-950/30 backdrop-blur-sm md:p-12">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Phase 1
          </span>
          <span className="text-sm text-emerald-100/80">Foundation ready</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-emerald-300/80">
              Personal Football Intelligence Dashboard
            </p>
            <h1 className="max-w-xl text-4xl font-black tracking-tight text-white md:text-6xl">
              AI-powered football briefings for your favorite teams.
            </h1>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <p className="text-sm text-emerald-100/70">Status</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Project foundation</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-300">
                LIVE
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        {projectPillars.map((pillar) => (
          <div
            key={pillar}
            className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-sm text-slate-200 shadow-lg shadow-slate-950/30"
          >
            <div className="mb-3 h-2 w-12 rounded-full bg-emerald-400" />
            {pillar}
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">Stack</p>
            <ul className="mt-4 space-y-2 text-slate-200">
              <li>• Next.js 16</li>
              <li>• TypeScript</li>
              <li>• Tailwind CSS</li>
              <li>• Supabase</li>
            </ul>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">Automation</p>
            <ul className="mt-4 space-y-2 text-slate-200">
              <li>• GitHub Actions</li>
              <li>• Render deployment</li>
              <li>• UptimeRobot</li>
              <li>• Telegram notifications</li>
            </ul>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">Data model</p>
            <ul className="mt-4 space-y-2 text-slate-200">
              <li>• Teams</li>
              <li>• Matches</li>
              <li>• Standings</li>
              <li>• Stories + sources</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
