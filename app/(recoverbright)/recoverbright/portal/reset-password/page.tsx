import Link from "next/link";
import { resetPasswordAction } from "./actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f9f7f4]">
        <div className="w-full max-w-sm rounded-xl border border-[#e8e3da] bg-white p-8 shadow-sm">
          <h1 className="mb-4 font-mono text-lg font-semibold text-[#1c1a17]">
            Password updated
          </h1>
          <p className="mb-6 text-sm text-[#1c1a17]/60">
            Your password has been reset successfully.
          </p>
          <Link href="/recoverbright/portal" className="btn-primary block text-center">
            Go to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f9f7f4]">
      <div className="w-full max-w-sm rounded-xl border border-[#e8e3da] bg-white p-8 shadow-sm">
        <h1 className="mb-2 font-mono text-lg font-semibold text-[#1c1a17]">
          Set new password
        </h1>
        <p className="mb-6 text-[13px] text-[#1c1a17]/50">
          Enter your new password below.
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 font-mono text-sm text-red-600">
            {error}
          </p>
        )}

        <form action={resetPasswordAction} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="password">
              New password
            </label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div>
            <label className="label" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              className="input"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <button type="submit" className="btn-primary">
            Update password
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
