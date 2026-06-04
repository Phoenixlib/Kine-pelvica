import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import {
  createCalComScheduleOverride,
  deleteCalComScheduleOverride,
} from "~/lib/calcom";

export const blockedSlotRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ startDate: z.date(), endDate: z.date() }))
    .query(async ({ ctx, input }) =>
      ctx.db.blockedSlot.findMany({
        where: { startAt: { gte: input.startDate }, endAt: { lte: input.endDate } },
        orderBy: { startAt: "asc" },
      })
    ),

  create: protectedProcedure
    .input(z.object({
      startAt: z.date(),
      endAt:   z.date(),
      reason:  z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Intentar bloquear en Cal.com
      let calComOverrideId: number | null = null;
      if (env.CALCOM_SCHEDULE_ID) {
        calComOverrideId = await createCalComScheduleOverride(
          env.CALCOM_SCHEDULE_ID,
          input.startAt,
          input.endAt,
        );
      }

      // 2. Guardar en BD local (siempre, aunque Cal.com falle)
      return ctx.db.blockedSlot.create({
        data: {
          startAt: input.startAt,
          endAt:   input.endAt,
          reason:  input.reason ?? null,
          calComOverrideId,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const slot = await ctx.db.blockedSlot.findUnique({ where: { id: input.id } });

      // 1. Eliminar override en Cal.com si existe
      if (slot?.calComOverrideId && env.CALCOM_SCHEDULE_ID) {
        await deleteCalComScheduleOverride(
          env.CALCOM_SCHEDULE_ID,
          slot.calComOverrideId,
        );
      }

      // 2. Eliminar de BD local
      return ctx.db.blockedSlot.delete({ where: { id: input.id } });
    }),
});
