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
      let calComOverrideId: number | null = null;
      let warning: string | null = null;

      // 1. Intentar bloquear en Cal.com
      if (env.CALCOM_SCHEDULE_ID) {
        try {
          calComOverrideId = await createCalComScheduleOverride(
            env.CALCOM_SCHEDULE_ID,
            input.startAt,
            input.endAt,
          );
        } catch (err: any) {
          console.error("Warning: Cal.com schedule override creation failed, proceeding with local block:", err);
          warning = err.message || "No se pudo sincronizar el bloqueo con Cal.com, pero se guardó localmente.";
        }
      } else {
        warning = "CALCOM_SCHEDULE_ID no configurado. El bloqueo es solo local.";
      }

      // 2. Guardar en BD local (siempre, aunque Cal.com falle)
      const slot = await ctx.db.blockedSlot.create({
        data: {
          startAt: input.startAt,
          endAt:   input.endAt,
          reason:  input.reason ?? null,
          calComOverrideId,
        },
      });

      return {
        ...slot,
        warning,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const slot = await ctx.db.blockedSlot.findUnique({ where: { id: input.id } });
      let warning: string | null = null;

      // 1. Eliminar override en Cal.com si existe
      if (slot && env.CALCOM_SCHEDULE_ID) {
        try {
          await deleteCalComScheduleOverride(
            env.CALCOM_SCHEDULE_ID,
            slot.startAt,
            slot.endAt,
          );
        } catch (err: any) {
          console.error("Warning: Cal.com schedule override deletion failed, proceeding with local deletion:", err);
          warning = err.message || "No se pudo eliminar el bloqueo en Cal.com, pero se eliminó localmente.";
        }
      }

      // 2. Eliminar de BD local
      const deletedSlot = await ctx.db.blockedSlot.delete({ where: { id: input.id } });

      return {
        ...deletedSlot,
        warning,
      };
    }),
});
