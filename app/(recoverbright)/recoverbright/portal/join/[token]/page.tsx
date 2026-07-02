import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { joinAction } from "./actions";

type Params = Promise<{ token: string }>;

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  // rw_invites has no anon SELECT policy (tokens must not be enumerable),
  // so this lookup uses the service-role client. The token itself is the
  // only credential — it comes from the URL, not from a broader query.
  const supabase = createServiceClient();
  const { data: invite } = await supabase
    .from("rw_invites")
    .select("id, practice_id, expires_at, rw_practices(name)")
    .eq("token", token)
    .single();

  if (!invite) notFound();

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f9f7f4]">
        <div className="w-full max-w-sm rounded-xl border border-[#e8e3da] bg-white p-8 shadow-sm text-center">
          <h1 className="mb-2 font-mono text-lg font-semibold text-[#1c1a17]">
            Invite expired
          </h1>
          <p className="text-[13px] text-[#1c1a17]/50">
            This invite link has expired. Ask your colleague for a new one.
          </p>
        </div>
      </main>
    );
  }

  const practiceRaw = invite.rw_practices as unknown;
  const practice = (Array.isArray(practiceRaw) ? practiceRaw[0] : practiceRaw) as { name: string } | null;
  const practiceName = practice?.name ?? "your practice";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f9f7f4]">
      <div className="w-full max-w-sm rounded-xl border border-[#e8e3da] bg-white p-8 shadow-sm">
        <h1 className="mb-1 font-mono text-lg font-semibold text-[#1c1a17]">
          Join {practiceName}
        </h1>
        <p className="mb-6 text-[13px] text-[#1c1a17]/50">
          Create your account to join the team on RecoverBright.
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 font-mono text-sm text-red-600">
            {decodeURIComponent(error)}
          </p>
        )}

        <form action={joinAction} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
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
            Join practice
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-[#1c1a17]/50">
          Already have an account?{" "}
          <Link
            href="/recoverbright/portal/login"
            className="text-[#1c1a17] underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
