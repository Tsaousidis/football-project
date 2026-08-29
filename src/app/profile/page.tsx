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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-12">
      <div className="w-full rounded-3xl border border-emerald-500/20 bg-slate-950/80 p-8">
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">Profile</p>
        <h1 className="mt-3 text-3xl font-black text-white">Signed in user</h1>
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-slate-200">
          <p>Email: {user.email}</p>
          <p className="mt-2 text-sm text-slate-400">User ID: {user.id}</p>
        </div>
      </div>
    </main>
  );
}
