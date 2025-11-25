"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { az } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PostActionsWrapper } from "@/components/admin/post-actions-wrapper";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  slug: string | null;
  publish: number;
  status: boolean;
  hidden: boolean;
  view_count: bigint | number;
  published_date: string | null;
  created_at: string | null;
  deleted_at: string | null;
  deleted_by?: string | null;
  author?: string | null;
};

type PostsRealtimeProps = {
  initialPosts: Post[];
};

export function PostsRealtime({ initialPosts }: PostsRealtimeProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const isDeletedPage = pathname?.includes("/deleted");

  // Client tərəfində ilk dəfə render olunduqda lastUpdate-i təyin et
  useEffect(() => {
    if (lastUpdate === null) {
      setLastUpdate(new Date());
    }
  }, [lastUpdate]);

  const fetchPosts = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const params = new URLSearchParams();
      const q = searchParams.get("q");
      const publish = searchParams.get("publish");
      const category = searchParams.get("category");
      const author = searchParams.get("author");
      
      // Silinmiş xəbərlər səhifəsində yalnız silinmiş xəbərləri göstər
      if (isDeletedPage) {
        params.append("includeDeleted", "true");
      } else {
        const includeDeleted = searchParams.get("includeDeleted");
        if (includeDeleted === "true") params.append("includeDeleted", "true");
      }

      if (q) params.append("q", q);
      if (publish) params.append("publish", publish);
      if (category) params.append("category", category);
      if (author) params.append("author", author);

      const response = await api.get<{ posts: Post[] }>(`/admin/posts?${params.toString()}`);
      
      // Silinmiş xəbərlər səhifəsində yalnız silinmiş xəbərləri filter et
      let filteredPosts = response.data.posts;
      if (isDeletedPage) {
        filteredPosts = response.data.posts.filter((post) => post.deleted_at !== null);
      } else {
        // Normal səhifədə silinmiş xəbərləri göstərmə
        if (!searchParams.get("includeDeleted")) {
          filteredPosts = response.data.posts.filter((post) => !post.deleted_at);
        }
      }
      
      setPosts(filteredPosts);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      // Səssiz xəta - istifadəçiyə göstərmə
    } finally {
      setIsRefreshing(false);
    }
  }, [searchParams, isDeletedPage]);

  // İlk yüklənmədə və searchParams dəyişdikdə yenilə
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Hər 10 saniyədə bir avtomatik yenilə
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts();
    }, 10000); // 10 saniyə

    return () => clearInterval(interval);
  }, [fetchPosts]);

  // Səhifə fokus olduqda yenilə
  useEffect(() => {
    const handleFocus = () => {
      fetchPosts();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchPosts]);

  const handleManualRefresh = () => {
    fetchPosts();
    toast.success("Məqalələr yeniləndi");
  };

  return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Son yenilənmə: {lastUpdate ? format(lastUpdate, "HH:mm:ss", { locale: az }) : "--:--:--"}
          </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Yenilə
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Başlıq</TableHead>
              <TableHead>Müəllif</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Yayımlanma</TableHead>
              <TableHead>Yayımlanma tarixi</TableHead>
              <TableHead className="text-right">Baxış</TableHead>
              <TableHead className="text-right">Əməliyyatlar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Məqalə tapılmadı
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/posts/${post.id}`} className="hover:underline">
                      {post.title}
                    </Link>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        Yaradıldı: {formatDate(post.created_at)}
                      </p>
                      {post.deleted_at && (
                        <p className="text-xs text-destructive">
                          Silindi: {formatDate(post.deleted_at)}
                          {post.deleted_by && ` • ${post.deleted_by}`}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{post.author || "Müəllif yoxdur"}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {post.deleted_at ? (
                        <Badge variant="destructive" className="text-xs">
                          Silinmiş
                        </Badge>
                      ) : (
                        <>
                          <Badge variant={post.status ? "success" : "secondary"}>
                            {post.status ? "Aktiv" : "Deaktiv"}
                          </Badge>
                          {post.hidden && (
                            <Badge variant="outline" className="text-xs">
                              Gizli
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.publish ? "default" : "secondary"}>
                      {post.publish ? "Yayımda" : "Qaralama"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {post.published_date ? (
                        <p className="text-sm text-muted-foreground">
                          {formatDate(post.published_date)}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">-</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(post.view_count || 0).toLocaleString("az-Latn-AZ")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {post.slug && post.status && post.publish === 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 w-8 p-0"
                          title="Saytda görüntülə"
                        >
                          <a
                            href={`/news/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        </Button>
                      )}
                                  <PostActionsWrapper
                                    postId={post.id}
                                    postTitle={post.title}
                                    status={post.status}
                                    publish={post.publish}
                                    deletedAt={post.deleted_at}
                                    onUpdate={fetchPosts}
                                  />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

