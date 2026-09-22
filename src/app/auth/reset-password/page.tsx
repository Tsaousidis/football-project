import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return <main className="mx-auto max-w-lg px-6 py-20 text-slate-200">
    <h1 className="text-3xl font-bold">Request a new reset link</h1>
    <p className="mt-4">Your session is missing or has expired. Open the link in your password reset email, or request another one.</p>
    <Link href="/auth/forgot-password" className="mt-6 inline-block text-emerald-300 underline">Request reset link</Link>
  </main>;
  return <ResetPasswordForm />;
}
