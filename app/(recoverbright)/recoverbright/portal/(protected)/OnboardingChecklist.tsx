"use client";

import Link from "next/link";
import { dismissOnboarding } from "./onboarding-actions";

type Step = {
  label: string;
  description: string;
  href: string;
  done: boolean;
};

export function OnboardingChecklist({ steps }: { steps: Step[] }) {
  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;

  if (completed === total) return null;

  return (
    <div className="mb-8 rounded-xl border border-[#e8e3da] bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-mono text-[13px] font-semibold uppercase tracking-wide text-[#1c1a17]">
            Getting Started
          </h2>
          <p className="mt-1 font-mono text-[12px] text-[#1c1a17]/40">
            {completed} of {total} complete
          </p>
        </div>
        <button
          onClick={() => dismissOnboarding()}
          className="font-mono text-[11px] text-[#1c1a17]/30 hover:text-[#1c1a17]/60 transition"
        >
          Dismiss
        </button>
      </div>

      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#1c1a17]/5">
        <div
          className="h-full rounded-full bg-[#1c1a17]/70 transition-all duration-300"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>

      <ul className="mt-5 space-y-3">
        {steps.map((step) => (
          <li key={step.label} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                step.done
                  ? "border-green-600 bg-green-50 text-green-600"
                  : "border-[#1c1a17]/15 text-transparent"
              }`}
            >
              {step.done && (
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  className="h-3 w-3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 6.5L5 9L9.5 3.5" />
                </svg>
              )}
            </span>
            <div className="flex-1">
              {step.done ? (
                <p className="font-mono text-[13px] text-[#1c1a17]/40 line-through">
                  {step.label}
                </p>
              ) : (
                <Link
                  href={step.href}
                  className="font-mono text-[13px] font-medium text-[#1c1a17] hover:underline"
                >
                  {step.label}
                </Link>
              )}
              {!step.done && (
                <p className="mt-0.5 font-mono text-[11px] text-[#1c1a17]/40">
                  {step.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
