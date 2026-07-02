import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headersList.get("x-real-ip") ?? "unknown";
}

// Fixed-window rate limit backed by rw_rate_limits (service-role only).
// Returns false once `limit` attempts have been recorded for this
// action+IP within `windowSeconds`.
export async function checkRateLimit(
  action: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const ip = await getClientIp();
  const key = `${action}:${ip}`;
  const supabase = createServiceClient();
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

  // Opportunistic cleanup keeps each key's row count bounded to ~limit.
  await supabase
    .from("rw_rate_limits")
    .delete()
    .eq("key", key)
    .lt("created_at", windowStart);

  const { count } = await supabase
    .from("rw_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("key", key);

  if ((count ?? 0) >= limit) {
    return false;
  }

  await supabase.from("rw_rate_limits").insert({ key });
  return true;
}
