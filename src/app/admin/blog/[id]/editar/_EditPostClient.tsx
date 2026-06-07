"use client";

import { BlogPostForm } from "../../_components/BlogPostForm";

interface Post {
  id: string;
  title: string;
  slug: string;
  description: string;
  body: unknown;
  mainImage: string | null;
  status: "DRAFT" | "PUBLISHED";
  categoryId: string | null;
}

export function EditPostClient({ post }: { post: Post }) {
  return (
    <BlogPostForm
      mode="edit"
      postId={post.id}
      initialData={{
        title: post.title,
        slug: post.slug,
        description: post.description,
        body: post.body as Record<string, unknown>,
        mainImage: post.mainImage,
        status: post.status,
        categoryId: post.categoryId,
      }}
    />
  );
}
