"use client";

import { Analytics } from "@vercel/analytics/next";
import { beforeSendFilter } from "@/lib/recoverbright/analytics";

export function RBAnalytics() {
  return <Analytics beforeSend={beforeSendFilter} />;
}
