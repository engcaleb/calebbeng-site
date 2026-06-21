import Link from "next/link";
import { forgotPasswordAction } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f9f7f4]">
      <div className="w-full max-w-sm rounded-xl border border-[#e8e3da] bg-white p-8 shadow-sm">
        <h1 className="mb-2 font-mono text-lg font-semibold text-[#1c1a17]">
          Reset password
        </h1>
        <p className="mb-6 text-[13px] text-[#1c1a17]/50">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {success && (
          <p className="mb-4 rounded-md bg-green-50 px-3 py-2 font-mono text-sm text-green-700">
            Check your email for a reset link.
          </p>
        )}

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 font-mono text-sm text-red-600">
            {error}
          </p>
        )}

        <form action={forgotPasswordAction} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <button type="submit" className="btn-primary">
            Send reset link
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-[#1c1a17]/50">
          <Link
            href="/recoverbright/portal/login"
            className="text-[#1c1a17] underline underline-offset-2"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
