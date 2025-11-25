import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/article-form";
import { Button } from "@/components/ui/button";

export default async function NewPostPage() {
  const categories = await prisma.categories.findMany({
    where: { status: true, deleted_at: null },
    select: { id: true, title: true },
    orderBy: { order: "asc" },
  });

  const options = categories.map((category) => ({
    id: category.id.toString(),
    title: category.title,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/posts">
            <ArrowLeft className="size-4 mr-2" />
            Geriyə
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">Yeni məqalə</h2>
          <p className="text-sm text-muted-foreground">
            Rich-text editor vasitəsilə məzmunu hazırlayın.
          </p>
        </div>
      </div>
      <ArticleForm categories={options} />
    </div>
  );
}

