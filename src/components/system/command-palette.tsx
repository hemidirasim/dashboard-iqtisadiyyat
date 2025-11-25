"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, LayoutDashboard, ListTree, NotebookPen } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { api } from "@/lib/api";

type CommandPost = {
  id: string;
  title: string;
};

const navItems = [
  { label: "Baxış paneli", href: "/dashboard", icon: LayoutDashboard },
  { label: "Məqalələr", href: "/dashboard/posts", icon: FileText },
  { label: "Kateqoriyalar", href: "/dashboard/categories", icon: ListTree },
  { label: "Wiki", href: "/dashboard/wiki", icon: NotebookPen },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<CommandPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const openHandler = () => setOpen(true);
    window.addEventListener("keydown", keyHandler);
    window.addEventListener("command-palette:open", openHandler as EventListener);
    return () => {
      window.removeEventListener("keydown", keyHandler);
      window.removeEventListener("command-palette:open", openHandler as EventListener);
    };
  }, []);

  const searchPosts = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (query.trim()) {
        params.append("q", query.trim());
      }
      const res = await api.get(`/admin/posts?${params.toString()}`);
      const list = res.data.posts ?? [];
      setPosts(list.map((post: any) => ({ id: post.id, title: post.title })));
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setPosts([]);
      return;
    }
    // İlk açılışda boş axtarış
    searchPosts("");
  }, [open, searchPosts]);

  useEffect(() => {
    if (!open) return;
    
    const timeoutId = setTimeout(() => {
      searchPosts(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, open, searchPosts]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      <CommandInput
        placeholder="Panel daxilində axtar..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? "Yüklənir..." : "Heç nə tapılmadı"}
        </CommandEmpty>
        {!searchQuery.trim() && (
          <CommandGroup heading="Naviqasiya">
            {navItems.map((item) => (
              <CommandItem
                key={item.href}
                value={`nav-${item.href}`}
                onSelect={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
                onClick={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
              >
                <item.icon className="mr-2 size-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!!posts.length && (
          <CommandGroup heading={searchQuery.trim() ? "Axtarış nəticələri" : "Son məqalələr"}>
            {posts.map((post) => (
              <CommandItem
                key={post.id}
                value={`post-${post.id}-${post.title}`}
                onSelect={() => {
                  setOpen(false);
                  router.push(`/dashboard/posts/${post.id}`);
                }}
                onClick={() => {
                  setOpen(false);
                  router.push(`/dashboard/posts/${post.id}`);
                }}
              >
                <FileText className="mr-2 size-4" />
                {post.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

