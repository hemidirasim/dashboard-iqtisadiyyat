"use client";

import { Command } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggleWrapper } from "@/components/system/theme-toggle-wrapper";
import { UserMenuWrapper } from "@/components/system/user-menu-wrapper";
import { QuickCreateDrawerWrapper } from "@/components/admin/quick-create-drawer-wrapper";
import { MobileSidebarTrigger } from "@/components/layout/mobile-sidebar-trigger";

type TopbarProps = {
  onMenuClick?: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="flex flex-col gap-4 border-b bg-background/80 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <MobileSidebarTrigger onClick={onMenuClick} />
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">İdarə paneli</p>
            <h1 className="text-2xl font-semibold tracking-tight">İqtisadiyyat xəbərləri</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.dispatchEvent(new Event("command-palette:open"))}
          >
            <Command className="size-4" />
            Cmd + K
          </Button>
          <QuickCreateDrawerWrapper />
          <ThemeToggleWrapper />
          <UserMenuWrapper />
        </div>
      </div>
    </header>
  );
}

