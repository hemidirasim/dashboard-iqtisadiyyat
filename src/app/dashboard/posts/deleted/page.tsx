import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PostsRealtime } from "@/components/admin/posts-realtime";
import { formatDate } from "@/lib/utils";

export default async function DeletedPostsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  // Yalnız admin (role >= 2) bu səhifəyə çıxış əldə edə bilər
  const userRole = session.user?.role ?? 0;
  const isAdmin = userRole >= 2;

  if (!isAdmin) {
    redirect("/dashboard/posts");
  }

  // Silinmiş xəbərləri və kimin sildiyini gətir
  // deleted_by field-i hələ database-də yoxdursa, xəta verməmək üçün try-catch istifadə edirik
  let deletedPosts: Array<{
    id: bigint;
    title: string;
    slug: string | null;
    publish: number;
    status: boolean;
    hidden: boolean | null;
    view_count: bigint;
    published_date: Date | null;
    created_at: Date | null;
    deleted_at: Date | null;
    deleted_by?: number | null;
  }> = [];

  try {
    deletedPosts = await prisma.posts.findMany({
      where: {
        deleted_at: { not: null },
      },
      orderBy: { deleted_at: "desc" },
      take: 100,
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
        deleted_by: true,
        opened_user_id: true,
      },
    } as any); // Type assertion for deleted_by field that might not exist yet
  } catch (error: any) {
    // Əgər deleted_by field-i yoxdursa, onu select-dən çıxarırıq
    if (error.message?.includes("deleted_by")) {
      deletedPosts = await prisma.posts.findMany({
        where: {
          deleted_at: { not: null },
        },
        orderBy: { deleted_at: "desc" },
        take: 100,
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
      } as any);
    } else {
      throw error;
    }
  }

  // Silən istifadəçilərin məlumatlarını gətir
  const deletedByUserIds = deletedPosts
    .map((post) => post.deleted_by ?? null)
    .filter((id): id is number => id !== null && id !== undefined);

  const deletedByUsers = await prisma.users.findMany({
    where: {
      id: { in: deletedByUserIds.map((id) => BigInt(id)) },
    },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
    },
  });

  const userMap = new Map(
    deletedByUsers.map((user) => [Number(user.id), user]),
  );

  // Müəllif məlumatlarını gətir
  const authorIds = deletedPosts
    .map((post) => (post as any).opened_user_id)
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
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Trash2 className="size-6" />
            Silinmiş xəbərlər
          </h2>
          <p className="text-sm text-muted-foreground">
            Silinmiş xəbərlərin siyahısı və silən istifadəçilər
          </p>
        </div>
      </div>

      <PostsRealtime
        initialPosts={deletedPosts.map((post) => {
          const deletedByUser = post.deleted_by ? userMap.get(post.deleted_by) : null;
          const deletedByName = deletedByUser
            ? `${deletedByUser.name} ${deletedByUser.surname || ""}`.trim() || deletedByUser.email || "Naməlum"
            : "Naməlum";

          const authorId = (post as any).opened_user_id;
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
            deleted_by: deletedByName,
            author: authorName,
          };
        })}
      />
    </div>
  );
}

