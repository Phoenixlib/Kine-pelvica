import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { cancelCalComBooking, rescheduleCalComBooking } from "~/lib/calcom";

export const appointmentRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).optional().default(20),
        status: z.enum(["BOOKED", "CASH_PENDING", "TRANSFERRED", "CANCELLED", "ATTENDED", "NO_SHOW"]).optional(),
        searchQuery: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const whereClause: any = {};
      
      if (input?.startDate || input?.endDate) {
        whereClause.date = {};
        if (input.startDate) {
          whereClause.date.gte = input.startDate;
        }
        if (input.endDate) {
          whereClause.date.lte = input.endDate;
        }
      }

      if (input?.status) {
        whereClause.status = input.status;
      }

      if (input?.searchQuery) {
        whereClause.OR = [
          { title: { contains: input.searchQuery, mode: "insensitive" } },
          {
            patient: {
              OR: [
                { firstName: { contains: input.searchQuery, mode: "insensitive" } },
                { lastName: { contains: input.searchQuery, mode: "insensitive" } },
                { email: { contains: input.searchQuery, mode: "insensitive" } },
                { phone: { contains: input.searchQuery, mode: "insensitive" } },
              ],
            },
          },
        ];
      }

      const [appointments, total] = await Promise.all([
        ctx.db.appointment.findMany({
          where: whereClause,
          include: {
            patient: true,
            service: true,
          },
          orderBy: { date: "desc" },
          skip,
          take: limit,
        }),
        ctx.db.appointment.count({ where: whereClause }),
      ]);

      return {
        appointments,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        title: z.string().min(1),
        serviceId: z.string().optional().nullable(),
        date: z.date(),
        durationMinutes: z.number().int().default(60),
        status: z.enum(["BOOKED", "CASH_PENDING", "TRANSFERRED", "CANCELLED", "ATTENDED", "NO_SHOW"]).default("BOOKED"),
        paymentMethod: z.enum(["CASH", "TRANSFER"]).optional().nullable(),
        cancelReason: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.appointment.create({
        data: {
          patientId: input.patientId,
          title: input.title,
          serviceId: input.serviceId || null,
          date: input.date,
          durationMinutes: input.durationMinutes,
          status: input.status,
          paymentMethod: input.paymentMethod || null,
          cancelReason: input.cancelReason || null,
          notes: input.notes || null,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        serviceId: z.string().optional().nullable(),
        date: z.date(),
        durationMinutes: z.number().int(),
        status: z.enum(["BOOKED", "CASH_PENDING", "TRANSFERRED", "CANCELLED", "ATTENDED", "NO_SHOW"]),
        paymentMethod: z.enum(["CASH", "TRANSFER"]).optional().nullable(),
        cancelReason: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.appointment.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new Error("Appointment not found");
      }

      // Synchronize cancellation or reschedule back to Cal.com if linked
      if (existing.calComEventId) {
        try {
          if (input.status === "CANCELLED" && existing.status !== "CANCELLED") {
            await cancelCalComBooking(existing.calComEventId, input.cancelReason || undefined);
          } else if (input.date.getTime() !== existing.date.getTime()) {
            await rescheduleCalComBooking(existing.calComEventId, input.date);
          }
        } catch (calError) {
          console.error("Cal.com sync error (proceeding with local DB update):", calError);
        }
      }

      return ctx.db.appointment.update({
        where: { id: input.id },
        data: {
          title: input.title,
          serviceId: input.serviceId || null,
          date: input.date,
          durationMinutes: input.durationMinutes,
          status: input.status,
          paymentMethod: input.paymentMethod || null,
          cancelReason: input.cancelReason || null,
          notes: input.notes || null,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.appointment.findUnique({
        where: { id: input.id },
      });

      if (existing?.calComEventId) {
        try {
          await cancelCalComBooking(existing.calComEventId, "Cita eliminada desde el panel de administración");
        } catch (calError) {
          console.error("Cal.com deletion sync error:", calError);
        }
      }

      return ctx.db.appointment.delete({
        where: { id: input.id },
      });
    }),
});
