"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

type MobileSidebarWrapperProps = {
  children: React.ReactNode;
  isAdmin?: boolean;
};

export function MobileSidebarWrapper({ children, isAdmin = false }: MobileSidebarWrapperProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isOpen} onOpenChange={setIsOpen} isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col">
        <Topbar onMenuClick={() => setIsOpen(true)} />
        {children}
      </div>
    </div>
  );
}

