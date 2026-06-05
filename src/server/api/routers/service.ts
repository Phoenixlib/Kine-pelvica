import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createCalComEventType, updateCalComEventType, deleteCalComEventType } from "~/lib/calcom";
import { revalidatePath } from "next/cache";

export const serviceRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.service.findMany({
      where: { isActive: true },
      include: {
        category: true,
      },
      orderBy: { order: "asc" },
    });
  }),

  getAllAdmin: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.service.findMany({
      include: {
        category: true,
      },
      orderBy: [
        { category: { order: "asc" } },
        { order: "asc" }
      ],
    });
  }),

  getCategories: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.serviceCategory.findMany({
      orderBy: { order: "asc" },
    });
  }),

  // Category CRUD
  createCategory: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        order: z.number().int().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.serviceCategory.create({
        data: {
          name: input.name,
          order: input.order,
        },
      });
    }),

  updateCategory: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        order: z.number().int().optional(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.serviceCategory.update({
        where: { id: input.id },
        data: {
          name: input.name,
          order: input.order,
          isActive: input.isActive,
        },
      });
    }),

  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.serviceCategory.delete({
        where: { id: input.id },
      });
    }),

  // Service CRUD with automatic Cal.com synchronization
  createService: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        price: z.number().int().positive(),
        duration: z.number().int().positive(),
        description: z.string().optional().nullable(),
        categoryId: z.string().optional().nullable(),
        order: z.number().int().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let calComEventTypeId: number | null = null;
      let calComBookingUrl: string | null = null;
      let calComSlug: string | null = null;

      const addressConfig = await ctx.db.siteConfig.findUnique({
        where: { key: "address" }
      });
      const locationAddress = addressConfig?.value || undefined;

      try {
        const calEvent = await createCalComEventType(
          input.name,
          input.duration,
          input.description || undefined,
          locationAddress
        );
        if (calEvent) {
          calComEventTypeId = calEvent.id;
          calComBookingUrl = calEvent.bookingUrl || `https://cal.com/camila-ortiz/${calEvent.slug}`;
          calComSlug = calEvent.slug;
        }
      } catch (error) {
        console.error("Cal.com event type creation failed, aborting service creation:", error);
        throw new Error("No se pudo crear el servicio en Cal.com. Inténtalo de nuevo.");
      }

      return ctx.db.service.create({
        data: {
          name: input.name,
          price: input.price,
          duration: input.duration,
          description: input.description || null,
          categoryId: input.categoryId || null,
          order: input.order,
          calComEventTypeId,
          calComBookingUrl,
          calComSlug,
        },
      });
    }),

  updateService: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        price: z.number().int().positive(),
        duration: z.number().int().positive(),
        description: z.string().optional().nullable(),
        categoryId: z.string().optional().nullable(),
        order: z.number().int().optional(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.service.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new Error("Service not found");
      }

      let calComEventTypeId = existing.calComEventTypeId;
      let calComBookingUrl = existing.calComBookingUrl;
      let calComSlug = existing.calComSlug;

      const addressConfig = await ctx.db.siteConfig.findUnique({
        where: { key: "address" }
      });
      const locationAddress = addressConfig?.value || undefined;

      // Sync event type details with Cal.com
      if (calComEventTypeId) {
        try {
          const calEvent = await updateCalComEventType(
            calComEventTypeId,
            input.name,
            input.duration,
            input.description || undefined,
            locationAddress
          );
          if (calEvent) {
            calComBookingUrl = calEvent.bookingUrl || `https://cal.com/camila-ortiz/${calEvent.slug}`;
            calComSlug = calEvent.slug;
          }
        } catch (error) {
          console.error(`Cal.com event type update failed for ${calComEventTypeId}:`, error);
        }
      } else {
        // Attempt to create it if it somehow wasn't created before
        try {
          const calEvent = await createCalComEventType(
            input.name,
            input.duration,
            input.description || undefined,
            locationAddress
          );
          if (calEvent) {
            calComEventTypeId = calEvent.id;
            calComBookingUrl = calEvent.bookingUrl || `https://cal.com/camila-ortiz/${calEvent.slug}`;
            calComSlug = calEvent.slug;
          }
        } catch (error) {
          console.error("Cal.com event type creation failed on update:", error);
        }
      }

      return ctx.db.service.update({
        where: { id: input.id },
        data: {
          name: input.name,
          price: input.price,
          duration: input.duration,
          description: input.description || null,
          categoryId: input.categoryId || null,
          order: input.order,
          isActive: input.isActive,
          calComEventTypeId,
          calComBookingUrl,
          calComSlug,
        },
      });
    }),

  deleteService: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.service.findUnique({
        where: { id: input.id },
      });

      if (existing?.calComEventTypeId) {
        try {
          await deleteCalComEventType(existing.calComEventTypeId);
        } catch (error) {
          console.error(`Cal.com event type deletion failed for ${existing.calComEventTypeId}:`, error);
        }
      }

      const result = await ctx.db.service.delete({
        where: { id: input.id },
      });
      revalidatePath("/", "layout");
      return result;
    }),

  reorderServices: protectedProcedure
    .input(z.array(z.object({ id: z.string(), order: z.number().int() })))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.map((item) =>
          ctx.db.service.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      );
      revalidatePath("/", "layout");
      return { success: true };
    }),

  reorderCategories: protectedProcedure
    .input(z.array(z.object({ id: z.string(), order: z.number().int() })))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.map((item) =>
          ctx.db.serviceCategory.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      );
      revalidatePath("/", "layout");
      return { success: true };
    }),
});
