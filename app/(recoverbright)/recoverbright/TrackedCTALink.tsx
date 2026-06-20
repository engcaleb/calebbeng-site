"use client";

import Link from "next/link";
import { rbTrack } from "@/lib/recoverbright/analytics";

export function TrackedCTALink({
  href,
  event,
  location,
  className,
  children,
}: {
  href: string;
  event: string;
  location: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={() => rbTrack(event, { location })}
      className={className}
    >
      {children}
    </Link>
  );
}
