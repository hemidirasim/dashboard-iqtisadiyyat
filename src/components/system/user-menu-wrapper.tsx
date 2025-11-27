"use client";

import dynamic from "next/dynamic";

const UserMenu = dynamic(
  () => import("@/components/system/user-menu").then((mod) => ({ default: mod.UserMenu })),
  { ssr: false }
);

export function UserMenuWrapper() {
  return <UserMenu />;
}



