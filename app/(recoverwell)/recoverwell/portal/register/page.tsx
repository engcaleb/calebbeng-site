import Link from "next/link";
import { registerAction } from "./actions";

export const metadata = { title: "Create Account — RecoverWell Portal" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f9f7f4]">
      <div className="w-full max-w-sm rounded-xl border border-[#e8e3da] bg-white p-8 shadow-sm">
        <h1 className="mb-1 font-mono text-lg font-semibold text-[#1c1a17]">
          RecoverWell Portal
        </h1>
        <p className="mb-6 text-[13px] text-[#1c1a17]/50">
          Create your practice account.
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 font-mono text-sm text-red-600">
            {decodeURIComponent(error)}
          </p>
        )}

        <form action={registerAction} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="practiceName">
              Practice name
            </label>
            <input
              className="input"
              id="practiceName"
              name="practiceName"
              type="text"
              required
              placeholder="Prestige Vision Center"
              autoComplete="organization"
            />
          </div>
          <div>
            <label className="label" htmlFor="doctorName">
              Your name
            </label>
            <input
              className="input"
              id="doctorName"
              name="doctorName"
              type="text"
              required
              placeholder="Dr. Jane Smith"
              autoComplete="name"
            />
          </div>
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
              placeholder="jane@prestige.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
            />
            <p className="mt-1 font-mono text-[11px] text-[#1c1a17]/35">
              8+ characters · at least one letter and one number
            </p>
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
            />
          </div>
          <button type="submit" className="btn-primary">
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-[#1c1a17]/50">
          Already have an account?{" "}
          <Link
            href="/recoverwell/portal/login"
            className="text-[#1c1a17] underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
