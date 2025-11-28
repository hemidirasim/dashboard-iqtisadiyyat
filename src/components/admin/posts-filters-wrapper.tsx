"use client";

import dynamic from "next/dynamic";

// PostsFilters komponentini client-only yüklə (hydration error-un qarşısını almaq üçün)
const PostsFilters = dynamic(() => import("@/components/admin/posts-filters").then((mod) => ({ default: mod.PostsFilters })), {
  ssr: false,
  loading: () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="h-10 rounded-md border bg-muted animate-pulse" />
      <div className="h-10 rounded-md border bg-muted animate-pulse" />
      <div className="h-10 rounded-md border bg-muted animate-pulse" />
      <div className="h-10 rounded-md border bg-muted animate-pulse" />
    </div>
  ),
});

type PostsFiltersProps = {
  initialSearch: string;
  initialPublish: string;
  initialCategory: string;
  initialAuthor: string;
  categories: Array<{ id: string; title: string }>;
  authors: Array<{ id: string; name: string }>;
};

export function PostsFiltersWrapper(props: PostsFiltersProps) {
  return <PostsFilters {...props} />;
}

