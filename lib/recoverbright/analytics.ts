"use client";

import { track } from "@vercel/analytics";
import type { BeforeSendEvent } from "@vercel/analytics/next";

function isExcluded(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("rb_no_track=1");
}

export function beforeSendFilter(event: BeforeSendEvent): BeforeSendEvent | null {
  if (isExcluded()) return null;
  return event;
}

export function rbTrack(
  name: string,
  properties?: Record<string, string | number | boolean | null>,
) {
  if (isExcluded()) return;
  track(name, properties ?? {});
}
