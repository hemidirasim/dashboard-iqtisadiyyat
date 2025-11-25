"use client";

import dynamic from "next/dynamic";

const QuickCreateDrawer = dynamic(
  () => import("@/components/admin/quick-create-drawer").then((mod) => ({ default: mod.QuickCreateDrawer })),
  { ssr: false }
);

export function QuickCreateDrawerWrapper() {
  return <QuickCreateDrawer />;
}

