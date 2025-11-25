"use client";

import dynamic from "next/dynamic";

const PostActions = dynamic(
  () => import("@/components/admin/post-actions").then((mod) => ({ default: mod.PostActions })),
  { ssr: false }
);

type PostActionsProps = {
  postId: string;
  postTitle: string;
  status: boolean;
  publish: number;
  deletedAt?: string | null;
  onUpdate?: () => void;
};

export function PostActionsWrapper(props: PostActionsProps) {
  return <PostActions {...props} />;
}

