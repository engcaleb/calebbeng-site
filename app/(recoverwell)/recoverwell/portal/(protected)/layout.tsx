import { requireDoctor } from "@/lib/recoverwell/auth";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirects to /recoverwell/portal/login if not authenticated.
  // React cache() ensures this shares the getUser() call with the page below.
  await requireDoctor();
  return <>{children}</>;
}
