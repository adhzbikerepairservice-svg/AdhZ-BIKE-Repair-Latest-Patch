"use client";

import { usePathname } from "next/navigation";

/** Renders its children everywhere except the shop admin, which has its own layout (no public footer). */
export default function HideOnAdmin({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith("/admin") ? null : <>{children}</>;
}
