"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  GalleryHorizontal,
  Landmark,
  LayoutDashboard,
  ListTree,
  ShieldCheck,
  Users,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

type SidebarContentProps = {
  onLinkClick?: () => void;
  isAdmin?: boolean;
};

const SidebarContent = ({ onLinkClick, isAdmin = false }: SidebarContentProps) => {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { title: "Baxış", href: "/dashboard", icon: LayoutDashboard },
    { title: "Məqalələr", href: "/dashboard/posts", icon: FileText },
    { title: "Kateqoriyalar", href: "/dashboard/categories", icon: ListTree },
    { title: "İstifadəçilər", href: "/dashboard/users", icon: Users },
    { title: "Wiki bazası", href: "/dashboard/wiki", icon: Landmark },
    { title: "Reklam blokları", href: "/dashboard/ads", icon: GalleryHorizontal },
    { title: "Silinmiş xəbərlər", href: "/dashboard/posts/deleted", icon: Trash2, adminOnly: true },
    { title: "Parametrlər", href: "/dashboard/settings", icon: ShieldCheck },
  ];

  const filteredNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      <div className="flex h-16 items-center border-b px-6">
        <div>
          <p className="text-sm font-semibold">iqtisadiyyat.az</p>
          <p className="text-xs text-muted-foreground">Admin panel</p>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <nav className="space-y-1 px-3 py-4">
          {filteredNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </>
  );
};

type SidebarProps = {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isAdmin?: boolean;
};

export function Sidebar({ isOpen, onOpenChange, isAdmin = false }: SidebarProps) {
  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SidebarContent onLinkClick={() => onOpenChange?.(false)} isAdmin={isAdmin} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden border-r bg-background/95 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent isAdmin={isAdmin} />
      </aside>
    </>
  );
}

