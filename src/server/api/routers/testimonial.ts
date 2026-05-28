import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const testimonialRouter = createTRPCRouter({
  getAllVisible: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.testimonial.findMany({
      where: { status: "READ" },
      orderBy: { createdAt: "desc" },
    });
  }),

  getAllAdmin: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.testimonial.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email().optional().nullable(),
        message: z.string().min(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.testimonial.create({
        data: {
          name: input.name,
          email: input.email || null,
          message: input.message,
          status: "PENDING",
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "READ", "ARCHIVED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.testimonial.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.testimonial.delete({
        where: { id: input.id },
      });
    }),
});
