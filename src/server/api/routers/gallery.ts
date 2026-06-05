import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { destroyByUrls } from "~/lib/cloudinary";
import { revalidatePath } from "next/cache";

export const galleryRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.galleryPhoto.findMany({
      where: { isVisible: true },
      orderBy: { order: "asc" },
    });
  }),

  getAllAdmin: protectedProcedure
    .input(
      z.object({
        page: z.number().int().default(1),
        limit: z.number().int().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const [items, total] = await Promise.all([
        ctx.db.galleryPhoto.findMany({
          orderBy: { order: "asc" },
          skip,
          take: input.limit,
        }),
        ctx.db.galleryPhoto.count(),
      ]);
      return {
        items,
        total,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        beforeUrl: z.string().url(),
        afterUrl: z.string().url(),
        caption: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const maxOrderPhoto = await ctx.db.galleryPhoto.findFirst({
        orderBy: { order: 'desc' }
      });
      const nextOrder = maxOrderPhoto ? maxOrderPhoto.order + 1 : 1;
      
      const result = await ctx.db.galleryPhoto.create({
        data: {
          beforeUrl: input.beforeUrl,
          afterUrl: input.afterUrl,
          caption: input.caption || null,
          order: nextOrder,
          isVisible: true,
        },
      });
      revalidatePath("/");
      return result;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        beforeUrl: z.string().url(),
        afterUrl: z.string().url(),
        caption: z.string().optional().nullable(),
        order: z.number().int(),
        isVisible: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.galleryPhoto.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new Error("Gallery photo not found");
      }

      // Cleanup old Cloudinary assets if urls changed
      try {
        const toDelete: string[] = [];
        if (existing.beforeUrl !== input.beforeUrl) {
          toDelete.push(existing.beforeUrl);
        }
        if (existing.afterUrl !== input.afterUrl) {
          toDelete.push(existing.afterUrl);
        }
        if (toDelete.length > 0) {
          await destroyByUrls(toDelete);
        }
      } catch (err) {
        console.error("Failed to delete old gallery photos from Cloudinary:", err);
      }

      const result = await ctx.db.galleryPhoto.update({
        where: { id: input.id },
        data: {
          beforeUrl: input.beforeUrl,
          afterUrl: input.afterUrl,
          caption: input.caption || null,
          order: input.order,
          isVisible: input.isVisible,
        },
      });
      revalidatePath("/");
      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.galleryPhoto.findUnique({
        where: { id: input.id },
      });

      if (existing) {
        try {
          await destroyByUrls([existing.beforeUrl, existing.afterUrl]);
        } catch (err) {
          console.error("Failed to delete gallery photos from Cloudinary on delete:", err);
        }
      }

      const result = await ctx.db.galleryPhoto.delete({
        where: { id: input.id },
      });
      revalidatePath("/");
      return result;
    }),

  reorder: protectedProcedure
    .input(z.array(z.object({ id: z.string(), order: z.number().int() })))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.map((item) =>
          ctx.db.galleryPhoto.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      );
      revalidatePath("/");
      return { success: true };
    }),
});
