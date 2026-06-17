"use client";

export function BackButton() {
  return (
    <button
      onClick={() => history.back()}
      className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1c1a17]/40 transition hover:text-[#1c1a17]"
    >
      ← Back to your recommendations
    </button>
  );
}
