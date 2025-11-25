import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth";
import { MobileSidebarWrapper } from "@/components/layout/mobile-sidebar-wrapper";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const userRole = session.user?.role ?? 0;
  const isAdmin = userRole >= 2;

  return (
    <MobileSidebarWrapper isAdmin={isAdmin}>
      <main className="flex-1 bg-muted/20 p-4 lg:p-8">{children}</main>
    </MobileSidebarWrapper>
  );
}

