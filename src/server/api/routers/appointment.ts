import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { cancelCalComBooking, rescheduleCalComBooking, createCalComBooking } from "~/lib/calcom";
import { env } from "~/env";
import { TRPCError } from "@trpc/server";
import { Prisma } from "../../../../generated/prisma";
import { startOfDay } from "date-fns";

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
        view: z.enum(["upcoming", "past", "all"]).optional().default("all"),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const whereClause: Prisma.AppointmentWhereInput = {};
      
      if (input?.startDate || input?.endDate) {
        const dateFilter: Prisma.DateTimeFilter = {};
        if (input.startDate) {
          dateFilter.gte = input.startDate;
        }
        if (input.endDate) {
          dateFilter.lte = input.endDate;
        }
        whereClause.date = dateFilter;
      }

      if (input?.status) {
        whereClause.status = input.status;
      }

      if (input?.searchQuery) {
        const query = input.searchQuery.trim();
        const words = query.split(/\s+/).filter(Boolean);

        if (words.length === 1) {
          whereClause.OR = [
            { title: { contains: words[0], mode: "insensitive" as const } },
            {
              patient: {
                OR: [
                  { firstName: { contains: words[0], mode: "insensitive" as const } },
                  { lastName: { contains: words[0], mode: "insensitive" as const } },
                  { email: { contains: words[0], mode: "insensitive" as const } },
                  { phone: { contains: words[0], mode: "insensitive" as const } },
                ],
              },
            },
          ];
        } else if (words.length > 1) {
          whereClause.AND = words.map((word) => ({
            OR: [
              { title: { contains: word, mode: "insensitive" as const } },
              {
                patient: {
                  OR: [
                    { firstName: { contains: word, mode: "insensitive" as const } },
                    { lastName: { contains: word, mode: "insensitive" as const } },
                    { email: { contains: word, mode: "insensitive" as const } },
                    { phone: { contains: word, mode: "insensitive" as const } },
                  ],
                },
              },
            ],
          }));
        }
      }

      let orderBy: Prisma.AppointmentOrderByWithRelationInput = { date: "asc" };
      if (input?.view === "upcoming") {
        const todayStart = startOfDay(new Date());
        const currentDateGte = input?.startDate && input.startDate > todayStart ? input.startDate : todayStart;
        whereClause.date = {
          ...(typeof whereClause.date === "object" ? whereClause.date : {}),
          gte: currentDateGte,
        };
        orderBy = { date: "asc" };
      } else if (input?.view === "past") {
        const todayStart = startOfDay(new Date());
        const currentDateLt = input?.endDate && input.endDate < todayStart ? input.endDate : todayStart;
        whereClause.date = {
          ...(typeof whereClause.date === "object" ? whereClause.date : {}),
          lt: currentDateLt,
        };
        orderBy = { date: "desc" };
      } else {
        orderBy = { date: "asc" };
      }

      const [appointments, total] = await Promise.all([
        ctx.db.appointment.findMany({
          where: whereClause,
          include: {
            patient: true,
            service: true,
          },
          orderBy,
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
      // Verificar conflicto de horario
      const appointmentStart = input.date;
      const appointmentEnd = new Date(appointmentStart.getTime() + input.durationMinutes * 60_000);

      // Para evitar bugs de zona horaria (donde setHours en UTC no coincide con el día local),
      // buscamos cualquier cita en una ventana de 24h alrededor de la nueva cita.
      // Así garantizamos cargar todo posible cruce y luego lo filtramos exactamente en memoria.
      const checkStart = new Date(appointmentStart.getTime() - 24 * 60 * 60 * 1000);
      const checkEnd = new Date(appointmentStart.getTime() + 24 * 60 * 60 * 1000);

      // Buscar citas en la ventana de 24 horas que no estén canceladas
      const candidateAppointments = await ctx.db.appointment.findMany({
        where: {
          status: { notIn: ["CANCELLED"] },
          date: {
            gte: checkStart,
            lte: checkEnd,
          },
        },
        select: { id: true, date: true, durationMinutes: true },
      });

      // Post-filtro en JS: Comparación exacta usando los timestamps
      const hasConflict = candidateAppointments.some((appt) => {
        const existingStart = appt.date;
        const existingEnd = new Date(existingStart.getTime() + appt.durationMinutes * 60_000);
        return appointmentStart < existingEnd && appointmentEnd > existingStart;
      });

      // Buscar bloqueos en la misma ventana de 24 horas
      const candidateBlocks = await ctx.db.blockedSlot.findMany({
        where: {
          startAt: {
            lte: checkEnd,
          },
          endAt: {
            gte: checkStart,
          },
        },
        select: { id: true, startAt: true, endAt: true },
      });

      const hasBlockConflict = candidateBlocks.some((block) => {
        const blockStart = block.startAt;
        const blockEnd = block.endAt;
        return appointmentStart < blockEnd && appointmentEnd > blockStart;
      });

      if (hasConflict || hasBlockConflict) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya existe una cita o un bloqueo en ese horario. Por favor elige un horario disponible.",
        });
      }

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
            const startIso = input.date.toISOString();
            console.log("[Cal.com] Attempting to create booking:", {
              eventTypeId: service.calComEventTypeId,
              startIso,
              attendeeName: `${patient.firstName} ${patient.lastName}`,
              attendeeEmail: patient.email,
            });
            const calRes = await createCalComBooking(
              service.calComEventTypeId,
              startIso,
              `${patient.firstName} ${patient.lastName}`,
              patient.email || `no_email_${Date.now()}@estudiopelvico.cl`,
              patient.phone || undefined
            );
            console.log("[Cal.com] Booking response:", JSON.stringify(calRes));
            if (calRes && calRes.data) {
              calComEventId = calRes.data.uid;
              calComBookingId = String(calRes.data.id);
            }
          } catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e);
            console.error("[Cal.com] Booking creation failed:", errMsg);
            
            // Try fallback if env variable is set
            if (process.env.CALCOM_FALLBACK_EVENT_TYPE_ID) {
              try {
                console.log("[Cal.com] Attempting fallback overbooking on event type:", process.env.CALCOM_FALLBACK_EVENT_TYPE_ID);
                const calFallbackRes = await createCalComBooking(
                  Number(process.env.CALCOM_FALLBACK_EVENT_TYPE_ID),
                  input.date.toISOString(),
                  `${patient.firstName} ${patient.lastName}`,
                  patient.email || `no_email_${Date.now()}@estudiopelvico.cl`,
                  patient.phone || undefined
                );
                
                if (calFallbackRes && calFallbackRes.data) {
                  calComEventId = calFallbackRes.data.uid;
                  calComBookingId = String(calFallbackRes.data.id);
                  console.log("[Cal.com] Fallback overbooking succeeded!");
                }
              } catch (fallbackErr) {
                const fallbackErrMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
                console.error("[Cal.com] Fallback overbooking failed too:", fallbackErrMsg);
                throw new TRPCError({
                  code: "CONFLICT",
                  message: "No se pudo agendar en Cal.com ni con sobrecupo. Es posible que el horario esté ocupado o no disponible.",
                });
              }
            } else {
              throw new TRPCError({
                code: "CONFLICT",
                message: "No se pudo agendar en Cal.com. Es posible que el horario esté ocupado o fuera de disponibilidad.",
              });
            }
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

      // Si se cambia la fecha o duración, validar conflictos
      if ((input.date && input.date.getTime() !== existing.date.getTime()) || (input.durationMinutes && input.durationMinutes !== existing.durationMinutes)) {
        const newStart = input.date ?? existing.date;
        const newDuration = input.durationMinutes ?? existing.durationMinutes;
        const newEnd = new Date(newStart.getTime() + newDuration * 60_000);

        // Buscar otras citas del mismo día que no estén canceladas y no sean la actual
        const sameDayAppointments = await ctx.db.appointment.findMany({
          where: {
            id: { not: input.id },
            status: { notIn: ["CANCELLED"] },
            date: {
              gte: new Date(new Date(newStart).setHours(0, 0, 0, 0)),
              lte: new Date(new Date(newStart).setHours(23, 59, 59, 999)),
            },
          },
          select: { id: true, date: true, durationMinutes: true },
        });

        const hasConflict = sameDayAppointments.some((appt) => {
          const apptStart = appt.date;
          const apptEnd = new Date(apptStart.getTime() + appt.durationMinutes * 60_000);
          return newStart < apptEnd && newEnd > apptStart;
        });

        // Buscar bloqueos del mismo día
        const sameDayBlocks = await ctx.db.blockedSlot.findMany({
          where: {
            startAt: {
              lte: new Date(new Date(newStart).setHours(23, 59, 59, 999)),
            },
            endAt: {
              gte: new Date(new Date(newStart).setHours(0, 0, 0, 0)),
            },
          },
          select: { id: true, startAt: true, endAt: true },
        });

        const hasBlockConflict = sameDayBlocks.some((block) => {
          const blockStart = block.startAt;
          const blockEnd = block.endAt;
          return newStart < blockEnd && newEnd > blockStart;
        });

        if (hasConflict || hasBlockConflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ya existe una cita o un bloqueo en ese horario. Por favor elige un horario disponible.",
          });
        }
      }

      // Synchronize cancellation or reschedule back to Cal.com if linked
      console.log("[update] existing.calComEventId:", existing.calComEventId);
      console.log("[update] input.date:", input.date?.toISOString(), "existing.date:", existing.date?.toISOString());
      
      if (existing.calComEventId) {
        try {
          if (input.status === "CANCELLED" && existing.status !== "CANCELLED") {
            console.log("[update] Calling cancelCalComBooking...");
            await cancelCalComBooking(existing.calComEventId, input.cancelReason || undefined);
            console.log("[update] cancelCalComBooking succeeded.");
          } else if (input.date && input.date.getTime() !== existing.date.getTime()) {
            console.log("[update] Calling rescheduleCalComBooking with", existing.calComEventId, input.date.toISOString());
            const calRes = await rescheduleCalComBooking(existing.calComEventId, input.date);
            console.log("[update] rescheduleCalComBooking succeeded:", calRes);
          }
        } catch (calError) {
          console.error("[update] Cal.com sync error:", calError);
          const errMsg = calError instanceof Error ? calError.message : String(calError);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Error al sincronizar con Cal.com: ${errMsg}. La cita no se ha modificado localmente para evitar desincronización.`,
            cause: calError,
          });
        }
      }

      const updateData: Prisma.AppointmentUpdateInput = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.serviceId !== undefined) {
        updateData.service = input.serviceId ? { connect: { id: input.serviceId } } : { disconnect: true };
      }
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
