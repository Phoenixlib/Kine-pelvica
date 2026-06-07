import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { headers } from "next/headers";
import { EditPostClient } from "./_EditPostClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarPostPage({ params }: PageProps) {
  const { id } = await params;

  const ctx = await createTRPCContext({ headers: await headers() });
  const caller = createCaller(ctx);

  let post;
  try {
    post = await caller.blog.getById({ id });
  } catch {
    notFound();
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/blog"
          className="p-2 rounded-xl text-teal/60 hover:bg-cream/60 hover:text-teal transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-title text-2xl text-teal">Editar post</h1>
          <p className="font-body text-sm text-teal/60 truncate max-w-xs">
            {post.title}
          </p>
        </div>
      </div>
      <EditPostClient post={post} />
    </div>
  );
}
