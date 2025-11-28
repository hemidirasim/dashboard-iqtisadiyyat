import Link from "next/link";
import { Plus } from "lucide-react";

import { prisma, withRetry } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PostsFiltersWrapper } from "@/components/admin/posts-filters-wrapper";
import { PostsRealtime } from "@/components/admin/posts-realtime";

type Props = {
  searchParams: {
    q?: string;
    publish?: string;
    category?: string;
    author?: string;
    includeDeleted?: string;
  };
};

export default async function PostsPage({ searchParams }: Props) {
  const search = searchParams.q;
  const publish = searchParams.publish ?? "live";
  const categoryId = searchParams.category;
  const authorId = searchParams.author;
  const includeDeleted = searchParams.includeDeleted === "true";

  // İstifadəçinin rolunu yoxla - yalnız admin (role >= 2) silinmiş xəbərləri görə bilər
  const session = await getCurrentSession();
  const userRole = session?.user?.role ?? 0;
  const isAdmin = userRole >= 2;
  const showDeleted = includeDeleted && isAdmin;

  const [categories, authors, categoryPostIds] = await Promise.all([
    withRetry(async () => {
      return await prisma.categories.findMany({
        where: { deleted_at: null, status: true },
        select: { id: true, title: true },
        orderBy: { order: "asc" },
      });
    }).catch(() => []),
    withRetry(async () => {
      return await prisma.users.findMany({
        where: { deleted_at: null, status: true },
        select: { id: true, name: true, surname: true, email: true },
        orderBy: { name: "asc" },
      });
    }).catch(() => []),
    categoryId
      ? withRetry(async () => {
          return await prisma.category_post.findMany({
            where: { category_id: BigInt(categoryId) },
            select: { post_id: true },
          });
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  const postIds = categoryPostIds.map((cp) => cp.post_id).filter(Boolean) as bigint[];

  // Retry logic for Prisma connection issues
  const posts = await withRetry(async () => {
    return await prisma.posts.findMany({
      where: {
        // Admin isə və showDeleted true-dursa, silinmiş xəbərləri də göstər
        ...(showDeleted ? {} : { deleted_at: null }),
        // Admin panelində gizli xəbərləri də göstər
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                  },
                },
                {
                  sub_title: {
                    contains: search,
                  },
                },
              ],
            }
          : {}),
        // Axtarış zamanı publish filterini tətbiq etmə (statusdan aslı olmayaraq)
        ...(search
          ? {}
          : publish === "draft"
            ? {
                publish: 0,
              }
            : publish === "live"
              ? {
                  publish: 1,
                }
              : {}),
        ...(categoryId && postIds.length > 0
          ? {
              id: {
                in: postIds,
              },
            }
          : categoryId && postIds.length === 0
            ? {
                id: {
                  in: [],
                },
              }
            : {}),
        ...(authorId
          ? {
              opened_user_id: Number(authorId),
            }
          : {}),
      },
      orderBy: [
        {
          published_date: {
            sort: "desc",
            nulls: "last",
          },
        },
        { created_at: "desc" },
      ],
      take: 50,
      select: {
        id: true,
        title: true,
        slug: true,
        publish: true,
        status: true,
        hidden: true,
        view_count: true,
        published_date: true,
        created_at: true,
        deleted_at: true,
        opened_user_id: true,
      },
    });
  }).catch((error) => {
    console.error("Error fetching posts:", error);
    return []; // Fallback: boş array qaytar
  });

  // Müəllif məlumatlarını gətir
  const authorIds = posts
    .map((post) => post.opened_user_id)
    .filter((id): id is number => id !== null && id !== undefined);

  const postAuthors = authorIds.length > 0
    ? await withRetry(async () => {
        return await prisma.users.findMany({
          where: {
            id: { in: authorIds.map((id) => BigInt(id)) },
          },
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        });
      }).catch(() => [])
    : [];

  const postAuthorMap = new Map(
    postAuthors.map((author) => [
      Number(author.id),
      `${author.name} ${author.surname || ""}`.trim() || author.email || "Naməlum",
    ]),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Məqalələr</h2>
          <p className="text-sm text-muted-foreground">
            Mövcud kontenti idarə edin, filtrləyin və yeniləyin.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/posts/new" target="_blank" rel="noopener noreferrer">
            <Plus className="size-4" />
            Yeni məqalə
          </Link>
        </Button>
      </div>

      <PostsFiltersWrapper
        initialSearch={search ?? ""}
        initialPublish={publish}
        initialCategory={categoryId ?? ""}
        initialAuthor={authorId ?? ""}
        categories={categories.map((c) => ({ id: c.id.toString(), title: c.title }))}
        authors={authors.map((a) => ({
          id: a.id.toString(),
          name: `${a.name} ${a.surname || ""}`.trim() || a.email || "",
        }))}
      />

      <PostsRealtime
        initialPosts={posts.map((post) => {
          const authorId = post.opened_user_id;
          const authorName = authorId ? postAuthorMap.get(authorId) || null : null;

          return {
            id: post.id.toString(),
            title: post.title,
            slug: post.slug || null,
            publish: post.publish,
            status: post.status,
            hidden: post.hidden ?? false,
            view_count: post.view_count,
            published_date: post.published_date?.toISOString() || null,
            created_at: post.created_at?.toISOString() || null,
            deleted_at: post.deleted_at?.toISOString() || null,
            author: authorName,
          };
        })}
      />
    </div>
  );
}

