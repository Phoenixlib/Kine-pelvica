import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BlogPostForm } from "../_components/BlogPostForm";

export default function NuevoPostPage() {
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
          <h1 className="font-title text-2xl text-teal">Nuevo post</h1>
          <p className="font-body text-sm text-teal/60">
            Crea una nueva publicación para el blog
          </p>
        </div>
      </div>
      <BlogPostForm mode="create" />
    </div>
  );
}
