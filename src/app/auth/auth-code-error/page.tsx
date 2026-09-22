import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6 py-12">
      <div className="w-full rounded-3xl border border-red-500/30 bg-slate-950/80 p-8 text-center shadow-xl shadow-red-950/20">
        <p className="text-sm uppercase tracking-[0.25em] text-red-300">Authentication error</p>
        <h1 className="mt-3 text-3xl font-black text-white">Could not complete sign-in</h1>
        <p className="mt-3 text-slate-300">
          This link may have expired or already been used. If you have already
          verified your email, you can sign in with your password.
        </p>
        <Link href="/auth/login" className="mt-6 inline-block rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
