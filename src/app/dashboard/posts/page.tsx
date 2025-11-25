import Link from "next/link";
import { Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PostsFilters } from "@/components/admin/posts-filters";
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
  const publish = searchParams.publish;
  const categoryId = searchParams.category;
  const authorId = searchParams.author;
  const includeDeleted = searchParams.includeDeleted === "true";

  // İstifadəçinin rolunu yoxla - yalnız admin (role >= 2) silinmiş xəbərləri görə bilər
  const session = await getCurrentSession();
  const userRole = session?.user?.role ?? 0;
  const isAdmin = userRole >= 2;
  const showDeleted = includeDeleted && isAdmin;

  const [categories, authors, categoryPostIds] = await Promise.all([
    prisma.categories.findMany({
      where: { deleted_at: null, status: true },
      select: { id: true, title: true },
      orderBy: { order: "asc" },
    }),
    prisma.users.findMany({
      where: { deleted_at: null, status: true },
      select: { id: true, name: true, surname: true, email: true },
      orderBy: { name: "asc" },
    }),
    categoryId
      ? prisma.category_post.findMany({
          where: { category_id: BigInt(categoryId) },
          select: { post_id: true },
        })
      : Promise.resolve([]),
  ]);

  const postIds = categoryPostIds.map((cp) => cp.post_id).filter(Boolean) as bigint[];

  const posts = await prisma.posts.findMany({
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
      ...(publish === "draft"
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
    orderBy: { created_at: "desc" },
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

  // Müəllif məlumatlarını gətir
  const authorIds = posts
    .map((post) => post.opened_user_id)
    .filter((id): id is number => id !== null && id !== undefined);

  const postAuthors = authorIds.length > 0
    ? await prisma.users.findMany({
        where: {
          id: { in: authorIds.map((id) => BigInt(id)) },
        },
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
        },
      })
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
          <Link href="/dashboard/posts/new">
            <Plus className="size-4" />
            Yeni məqalə
          </Link>
        </Button>
      </div>

                  <PostsFilters
                    initialSearch={search ?? ""}
                    initialPublish={publish ?? ""}
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

