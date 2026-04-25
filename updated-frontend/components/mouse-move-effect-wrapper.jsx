"use client";

import { usePathname } from "next/navigation";
import MouseMoveEffect from "./mouse-move-effect";

export default function MouseMoveEffectWrapper() {
  const pathname = usePathname();

  // Disable cursor glow effect on doctor and facilitator dashboard pages
  const isDashboardPage = pathname === "/doctor" || pathname === "/facilitator";

  if (isDashboardPage) {
    return null;
  }

  return <MouseMoveEffect />;
}
