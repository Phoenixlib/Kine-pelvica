import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import {
  createCalComScheduleOverride,
  deleteCalComScheduleOverride,
  getCalComVirtualBlockedSlots,
  getCalComScheduleAvailability,
} from "~/lib/calcom";

export const blockedSlotRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ startDate: z.date(), endDate: z.date() }))
    .query(async ({ ctx, input }) => {
      const localBlocks = await ctx.db.blockedSlot.findMany({
        where: { startAt: { gte: input.startDate }, endAt: { lte: input.endDate } },
        orderBy: { startAt: "asc" },
      });

      const virtualBlocks = await getCalComVirtualBlockedSlots(input.startDate, input.endDate);

      const localBlocksMapped = localBlocks.map(lb => ({
        ...lb,
        isVirtual: false,
      }));

      const mergedBlocks = [...localBlocksMapped];

      for (const virtual of virtualBlocks) {
        const existsLocal = localBlocks.some(
          (lb) => Math.abs(lb.startAt.getTime() - virtual.startAt.getTime()) < 60000 &&
                  Math.abs(lb.endAt.getTime() - virtual.endAt.getTime()) < 60000
        );

        if (!existsLocal) {
          mergedBlocks.push({
            id: virtual.id,
            startAt: virtual.startAt,
            endAt: virtual.endAt,
            reason: virtual.reason,
            calComOverrideId: null,
            createdAt: new Date(),
            isVirtual: true,
          });
        }
      }

      return mergedBlocks.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    }),

  getAvailability: protectedProcedure
    .query(async () => {
      return getCalComScheduleAvailability();
    }),

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
      if (input.id.startsWith("virtual_")) {
        const parts = input.id.split("_");
        let warning: string | null = null;
        if (parts.length === 3 && env.CALCOM_SCHEDULE_ID) {
          const startAt = new Date(parseInt(parts[1]!, 10));
          const endAt = new Date(parseInt(parts[2]!, 10));
          
          try {
            await deleteCalComScheduleOverride(env.CALCOM_SCHEDULE_ID, startAt, endAt);
            return {
              id: input.id,
              startAt,
              endAt,
              reason: "Virtual",
              calComOverrideId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              warning: null
            };
          } catch (err: any) {
            console.error("Failed to delete virtual block in Cal.com", err);
            warning = "Hubo un error eliminando la anulación directamente en Cal.com.";
          }
        }
        return {
          id: input.id,
          startAt: new Date(),
          endAt: new Date(),
          reason: "Virtual",
          calComOverrideId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          warning: warning ?? "No se pudo identificar el bloqueo. Por favor, elimínalo directamente en tu panel de Cal.com."
        };
      }

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
