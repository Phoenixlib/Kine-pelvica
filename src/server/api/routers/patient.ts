import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const patientRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.patient.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.patient.findUnique({
        where: { id: input.id },
        include: {
          appointments: {
            orderBy: { date: "desc" },
          },
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        rut: z.string().optional(),
        birthDate: z.date().optional(),
        notes: z.string().optional(),
        status: z.enum(["Active", "Inactive"]).default("Active"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.patient.create({
        data: {
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          rut: input.rut || null,
          birthDate: input.birthDate || null,
          notes: input.notes || null,
          status: input.status,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        rut: z.string().optional(),
        birthDate: z.date().optional(),
        notes: z.string().optional(),
        status: z.enum(["Active", "Inactive"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.patient.update({
        where: { id: input.id },
        data: {
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          rut: input.rut || null,
          birthDate: input.birthDate || null,
          notes: input.notes || null,
          status: input.status,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.patient.delete({
        where: { id: input.id },
      });
    }),
});
