import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const appointmentRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
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

      return ctx.db.appointment.findMany({
        where: whereClause,
        include: {
          patient: true,
        },
        orderBy: { date: "asc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        title: z.string().min(1),
        serviceCategory: z.string().optional(),
        date: z.date(),
        durationMinutes: z.number().int().default(60),
        status: z.enum(["Confirmed", "Pending", "Cancelled"]).default("Confirmed"),
        paymentStatus: z.enum(["Paid", "Unpaid", "Partial"]).default("Unpaid"),
        amountPaid: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update patient lastVisit
      await ctx.db.patient.update({
        where: { id: input.patientId },
        data: { lastVisit: input.date },
      });

      return ctx.db.appointment.create({
        data: {
          patientId: input.patientId,
          title: input.title,
          serviceCategory: input.serviceCategory || null,
          date: input.date,
          durationMinutes: input.durationMinutes,
          status: input.status,
          paymentStatus: input.paymentStatus,
          amountPaid: input.amountPaid || 0,
          notes: input.notes || null,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        serviceCategory: z.string().optional(),
        date: z.date(),
        durationMinutes: z.number().int(),
        status: z.enum(["Confirmed", "Pending", "Cancelled"]),
        paymentStatus: z.enum(["Paid", "Unpaid", "Partial"]),
        amountPaid: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.appointment.update({
        where: { id: input.id },
        data: {
          title: input.title,
          serviceCategory: input.serviceCategory || null,
          date: input.date,
          durationMinutes: input.durationMinutes,
          status: input.status,
          paymentStatus: input.paymentStatus,
          amountPaid: input.amountPaid || 0,
          notes: input.notes || null,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.appointment.delete({
        where: { id: input.id },
      });
    }),
});
