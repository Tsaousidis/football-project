import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding", label: "Teams" },
  { href: "/research", label: "Research" },
  { href: "/profile", label: "Profile" },
];

export function AppNav() {
  return (
    <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 pt-6 md:px-10">
      <Link href="/dashboard" className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
        Football Intelligence
      </Link>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-emerald-400/50 hover:text-emerald-200"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}