import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";

import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/article-form";
import { PostActionsWrapper } from "@/components/admin/post-actions-wrapper";
import { PostEditingStatus } from "@/components/admin/post-editing-status";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{
    postId: string;
  }>;
};

export default async function EditPostPage({ params }: Props) {
  const { postId } = await params;
  const id = BigInt(postId);
  const post = await prisma.posts.findUnique({
    where: { id },
  });

  if (!post || post.deleted_at) {
    notFound();
  }

  const [categories, selectedCategories, galleryImages] = await Promise.all([
    prisma.categories.findMany({
      where: { deleted_at: null, status: true },
      select: { id: true, title: true },
      orderBy: { order: "asc" },
    }),
    prisma.category_post.findMany({
      where: { post_id: post.id },
      select: { category_id: true },
    }),
    prisma.post_galeries.findMany({
      where: { 
        post_id: Number(post.id), 
        deleted_at: null,
      },
      select: { name: true },
      orderBy: { created_at: "asc" },
    }),
  ]);

  // published_date-i datetime-local formatına çevir (Bakı vaxtında göstərmək üçün)
  const formatDateTimeLocal = (date: Date | null | undefined): string => {
    if (!date) return "";
    // UTC tarixini Bakı vaxtına çevir və datetime-local formatına gətir
    return formatInTimeZone(date, "Asia/Baku", "yyyy-MM-dd'T'HH:mm");
  };

  const defaultValues = {
    title: post.title,
    slug: post.slug ?? "",
    subTitle: post.sub_title ?? "",
    keywords: post.seo_keyword ?? "",
    content: post.content ?? "",
    status: post.status,
    publish: post.publish === 1,
    hidden: post.hidden ?? false,
    publishedDate: formatDateTimeLocal(post.published_date),
    categoryIds: selectedCategories
      .map((item) => item.category_id)
      .filter(Boolean)
      .map((value) => value!.toString()),
    imageUrl: post.image_url ?? "",
    videoEmbed: post.youtube_link ?? "",
    galleryImages: (() => {
      const images = galleryImages
        .map((img) => img.name)
        .filter((name): name is string => Boolean(name) && typeof name === "string" && name.trim().length > 0);
      
      // Debug üçün console.log
      console.log("EditPostPage: Processed gallery images", {
        postId: post.id.toString(),
        rawCount: galleryImages.length,
        processedCount: images.length,
        rawImages: galleryImages.map((img) => img.name),
        processedImages: images,
      });
      
      return images;
    })(),
  };

  const options = categories.map((category) => ({
    id: category.id.toString(),
    title: category.title,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/posts">
              <ArrowLeft className="size-4 mr-2" />
              Geriyə
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">Məqaləni redaktə et</h2>
            <p className="text-sm text-muted-foreground">{post.title}</p>
          </div>
        </div>
        <PostActionsWrapper
          postId={post.id.toString()}
          postTitle={post.title}
          status={post.status}
          publish={post.publish}
        />
      </div>
      <PostEditingStatus postId={post.id.toString()} />
      <ArticleForm postId={post.id.toString()} categories={options} defaultValues={defaultValues} />
    </div>
  );
}

