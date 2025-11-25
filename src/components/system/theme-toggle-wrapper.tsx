"use client";

import dynamic from "next/dynamic";

const ThemeToggle = dynamic(
  () => import("@/components/system/theme-toggle").then((mod) => ({ default: mod.ThemeToggle })),
  { ssr: false }
);

export function ThemeToggleWrapper() {
  return <ThemeToggle />;
}

