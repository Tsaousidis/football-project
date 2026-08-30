import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  async function signOut() {
    "use server";

    const serverSupabase = await createSupabaseServerClient();
    await serverSupabase.auth.signOut();
    redirect("/auth/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-12">
      <div className="w-full rounded-3xl border border-emerald-500/20 bg-slate-950/80 p-8 shadow-2xl shadow-emerald-950/20">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">Profile</p>
            <h1 className="mt-3 text-3xl font-black text-white">Account settings</h1>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
          <p className="mt-2 break-all text-lg font-semibold text-white">{user.email}</p>
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-slate-400">User ID</p>
          <p className="mt-2 break-all font-mono text-xs text-slate-400">{user.id}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/dashboard"
            className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Open dashboard
          </a>
          <a
            href="/onboarding"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Manage teams
          </a>
        </div>
      </div>
    </main>
  );
}
