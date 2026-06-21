"use client";

import { useState, useTransition } from "react";
import { createInviteLink } from "./actions";

export function TeamSection({
  teammates,
  currentDoctorId,
  practiceId,
}: {
  teammates: { id: string; name: string; slug: string }[];
  currentDoctorId: string;
  practiceId: string;
}) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleInvite() {
    startTransition(async () => {
      const url = await createInviteLink(practiceId);
      setInviteUrl(url);
      setCopied(false);
    });
  }

  function handleCopy() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border-t border-[#e8e3da] pt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm font-semibold text-[#1c1a17]">Team</h2>
        <button
          type="button"
          onClick={handleInvite}
          disabled={isPending}
          className="btn-ghost"
        >
          {isPending ? "Generating…" : "Invite colleague"}
        </button>
      </div>

      {inviteUrl && (
        <div className="mt-3 rounded-lg border border-[#e8e3da] bg-[#f9f7f4] p-3">
          <p className="mb-1 font-mono text-[11px] text-[#1c1a17]/50">
            Share this link (expires in 7 days):
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={inviteUrl}
              className="input flex-1 text-[12px]"
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="btn-ghost shrink-0"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {teammates.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between rounded-lg border border-[#e8e3da] bg-white px-4 py-3"
          >
            <span className="text-sm text-[#1c1a17]">{t.name}</span>
            {t.id === currentDoctorId && (
              <span className="font-mono text-[11px] text-[#1c1a17]/40">You</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
