import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { cancelCalComBooking, rescheduleCalComBooking, createCalComBooking } from "~/lib/calcom";

export const appointmentRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).optional().default(20),
        status: z.enum(["BOOKED", "CONFIRMED", "ATTENDED", "NO_SHOW", "CANCELLED"]).optional(),
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
        status: z.enum(["BOOKED", "CONFIRMED", "ATTENDED", "NO_SHOW", "CANCELLED"]).default("BOOKED"),
        paymentMethod: z.enum(["PENDING", "CASH_PENDING", "TRANSFER", "CASH_PAID"]).default("PENDING").nullable(),
        cancelReason: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let calComEventId: string | null = null;
      let calComBookingId: string | null = null;

      if (input.serviceId) {
        // Fetch service and patient to sync with Cal.com
        const [service, patient] = await Promise.all([
          ctx.db.service.findUnique({ where: { id: input.serviceId } }),
          ctx.db.patient.findUnique({ where: { id: input.patientId } })
        ]);

        if (service?.calComEventTypeId && patient) {
          try {
            // start is in UTC ISO format (which Cal.com expects)
            const startIso = input.date.toISOString(); 
            const calRes = await createCalComBooking(
              service.calComEventTypeId,
              startIso,
              `${patient.firstName} ${patient.lastName}`,
              patient.email || `no_email_${Date.now()}@estudiopelvico.cl`,
              patient.phone || undefined
            );
            if (calRes && calRes.data) {
              calComEventId = calRes.data.uid;
              calComBookingId = String(calRes.data.id);
            }
          } catch (e) {
            console.error("Error al agendar en Cal.com durante creación manual", e);
            // We proceed with local creation even if Cal.com fails
          }
        }
      }

      return ctx.db.appointment.create({
        data: {
          patientId: input.patientId,
          title: input.title,
          serviceId: input.serviceId || null,
          date: input.date,
          durationMinutes: input.durationMinutes,
          status: input.status,
          paymentMethod: input.paymentMethod || "PENDING",
          cancelReason: input.cancelReason || null,
          notes: input.notes || null,
          calComEventId,
          calComBookingId,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        serviceId: z.string().optional().nullable(),
        date: z.date().optional(),
        durationMinutes: z.number().int().optional(),
        status: z.enum(["BOOKED", "CONFIRMED", "ATTENDED", "NO_SHOW", "CANCELLED"]).optional(),
        paymentMethod: z.enum(["PENDING", "CASH_PENDING", "TRANSFER", "CASH_PAID"]).optional().nullable(),
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
          } else if (input.date && input.date.getTime() !== existing.date.getTime()) {
            await rescheduleCalComBooking(existing.calComEventId, input.date);
          }
        } catch (calError) {
          console.error("Cal.com sync error (proceeding with local DB update):", calError);
        }
      }

      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.serviceId !== undefined) updateData.serviceId = input.serviceId;
      if (input.date !== undefined) updateData.date = input.date;
      if (input.durationMinutes !== undefined) updateData.durationMinutes = input.durationMinutes;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.paymentMethod !== undefined) updateData.paymentMethod = input.paymentMethod;
      if (input.cancelReason !== undefined) updateData.cancelReason = input.cancelReason;
      if (input.notes !== undefined) updateData.notes = input.notes;

      return ctx.db.appointment.update({
        where: { id: input.id },
        data: updateData,
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
