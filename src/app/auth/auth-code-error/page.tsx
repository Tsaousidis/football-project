export default function AuthCodeErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6 py-12">
      <div className="w-full rounded-3xl border border-red-500/30 bg-slate-950/80 p-8 text-center shadow-xl shadow-red-950/20">
        <p className="text-sm uppercase tracking-[0.25em] text-red-300">Authentication error</p>
        <h1 className="mt-3 text-3xl font-black text-white">Could not complete sign-in</h1>
        <p className="mt-3 text-slate-300">
          The authentication link may have expired or the flow was interrupted.
        </p>
      </div>
    </main>
  );
}
