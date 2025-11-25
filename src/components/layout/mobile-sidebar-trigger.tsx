"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

type MobileSidebarTriggerProps = {
  onClick?: () => void;
};

export function MobileSidebarTrigger({ onClick }: MobileSidebarTriggerProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={onClick}
    >
      <Menu className="size-5" />
      <span className="sr-only">Menu aç</span>
    </Button>
  );
}

