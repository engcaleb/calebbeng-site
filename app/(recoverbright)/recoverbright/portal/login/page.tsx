import Link from "next/link";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f9f7f4]">
      <div className="w-full max-w-sm rounded-xl border border-[#e8e3da] bg-white p-8 shadow-sm">
        <h1 className="mb-6 font-mono text-lg font-semibold text-[#1c1a17]">
          RecoverBright Portal
        </h1>

        {error === "invalid_credentials" && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 font-mono text-sm text-red-600">
            Invalid email or password.
          </p>
        )}

        <form action={loginAction} className="flex flex-col gap-4">
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
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-primary">
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-[#1c1a17]/50">
          New practice?{" "}
          <Link
            href="/recoverbright/portal/register"
            className="text-[#1c1a17] underline underline-offset-2"
          >
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}
