import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const communityMessageRouter = createTRPCRouter({
  getAllAdmin: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.communityMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email().optional().nullable(),
        message: z.string().min(5),
        type: z.enum(["EXPERIENCE", "QUESTION"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.communityMessage.create({
        data: {
          name: input.name,
          email: input.email || null,
          message: input.message,
          type: input.type,
          status: "PENDING",
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "READ", "PUBLISHED_IN_BLOG"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.communityMessage.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.communityMessage.delete({
        where: { id: input.id },
      });
    }),
});
