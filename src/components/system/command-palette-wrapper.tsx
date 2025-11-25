"use client";

import dynamic from "next/dynamic";

const CommandPalette = dynamic(
  () => import("@/components/system/command-palette").then((mod) => ({ default: mod.CommandPalette })),
  { ssr: false }
);

export function CommandPaletteWrapper() {
  return <CommandPalette />;
}

