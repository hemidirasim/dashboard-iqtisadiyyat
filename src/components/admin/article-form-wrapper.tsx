"use client";

import dynamic from "next/dynamic";
import { ArticleFormProps } from "./article-form";

// ArticleForm komponentini client-only yüklə (hydration error-un qarşısını almaq üçün)
const ArticleForm = dynamic(() => import("@/components/admin/article-form").then((mod) => ({ default: mod.ArticleForm })), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="h-10 rounded-md border bg-muted animate-pulse" />
      <div className="h-32 rounded-md border bg-muted animate-pulse" />
      <div className="h-64 rounded-md border bg-muted animate-pulse" />
    </div>
  ),
});

export function ArticleFormWrapper(props: ArticleFormProps) {
  return <ArticleForm {...props} />;
}

