import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { revalidatePath } from "next/cache";
import { TRPCError } from "@trpc/server";
import { Prisma } from "../../../../generated/prisma";
import { destroyByUrls } from "~/lib/cloudinary";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const blogPostInputSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(200),
  body: z.record(z.unknown()), // Tiptap JSON
  mainImage: z.string().url().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: z.string().datetime().nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

export const blogRouter = createTRPCRouter({
  // PUBLIC —————————————————————————————————
  getPublishedPosts: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        mainImage: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } },
      },
      orderBy: { publishedAt: "desc" },
    });
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.blogPost.findUnique({
        where: { slug: input.slug },
        include: { category: true },
      });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      return post;
    }),

  // ADMIN —————————————————————————————————
  getAllAdmin: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).default(10),
        search: z.string().optional(),
        categoryId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const take = input.limit;

      const where: Prisma.BlogPostWhereInput = {};

      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
        ];
      }

      if (input.categoryId) {
        where.categoryId = input.categoryId;
      }

      const [posts, totalCount] = await Promise.all([
        ctx.db.blogPost.findMany({
          where,
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            mainImage: true,
            status: true,
            publishedAt: true,
            createdAt: true,
            category: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take,
        }),
        ctx.db.blogPost.count({ where }),
      ]);

      return {
        posts,
        totalCount,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.blogPost.findUnique({
        where: { id: input.id },
        include: { category: true },
      });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      return post;
    }),

  getCategories: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.blogCategory.findMany({ orderBy: { name: "asc" } });
  }),

  create: protectedProcedure
    .input(blogPostInputSchema)
    .mutation(async ({ ctx, input }) => {
      const slug = input.slug?.trim() || generateSlug(input.title);

      // Validar slug único
      const existing = await ctx.db.blogPost.findUnique({ where: { slug } });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Ya existe un artículo con esta misma URL (slug). Por favor cambia el título o edita el slug manualmente.",
        });
      }

      const post = await ctx.db.blogPost.create({
        data: {
          title: input.title,
          slug,
          description: input.description,
          body: input.body as Prisma.InputJsonValue,
          mainImage: input.mainImage ?? null,
          status: input.status,
          publishedAt:
            input.status === "PUBLISHED"
              ? input.publishedAt
                ? new Date(input.publishedAt)
                : new Date()
              : null,
          categoryId: input.categoryId ?? null,
        },
      });
      revalidatePath("/blog");
      revalidatePath("/admin/blog");
      return post;
    }),

  update: protectedProcedure
    .input(blogPostInputSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const slug = input.slug?.trim() || generateSlug(input.title);

      // Validar slug único excluyendo el actual
      const existing = await ctx.db.blogPost.findFirst({
        where: { slug, NOT: { id: input.id } },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Ya existe un artículo con esta misma URL (slug). Por favor cambia el título o edita el slug manualmente.",
        });
      }

      const currentPost = await ctx.db.blogPost.findUnique({
        where: { id: input.id },
        select: { mainImage: true },
      });

      const post = await ctx.db.blogPost.update({
        where: { id: input.id },
        data: {
          title: input.title,
          slug,
          description: input.description,
          body: input.body as Prisma.InputJsonValue,
          mainImage: input.mainImage ?? null,
          status: input.status,
          publishedAt:
            input.status === "PUBLISHED"
              ? input.publishedAt
                ? new Date(input.publishedAt)
                : new Date()
              : null,
          categoryId: input.categoryId ?? null,
        },
      });

      if (currentPost?.mainImage && currentPost.mainImage !== input.mainImage) {
        await destroyByUrls([currentPost.mainImage]);
      }

      revalidatePath("/blog");
      revalidatePath(`/blog/${slug}`);
      revalidatePath("/admin/blog");
      return post;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.blogPost.findUnique({
        where: { id: input.id },
        select: { mainImage: true },
      });
      await ctx.db.blogPost.delete({ where: { id: input.id } });
      if (post?.mainImage) {
        await destroyByUrls([post.mainImage]);
      }
      revalidatePath("/blog");
      revalidatePath("/admin/blog");
      return { success: true };
    }),

  createCategory: protectedProcedure
    .input(z.object({ name: z.string().min(1), slug: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.blogCategory.create({
        data: { name: input.name, slug: input.slug },
      });
    }),

  updateCategory: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        slug: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.blogCategory.update({
        where: { id: input.id },
        data: { name: input.name, slug: input.slug },
      });
    }),

  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Desasociar posts primero
      await ctx.db.blogPost.updateMany({
        where: { categoryId: input.id },
        data: { categoryId: null },
      });
      return ctx.db.blogCategory.delete({
        where: { id: input.id },
      });
    }),
});
