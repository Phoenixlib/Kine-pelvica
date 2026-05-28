import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const patientRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).optional().default(20),
        searchQuery: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const whereClause: any = {};

      if (input?.searchQuery) {
        whereClause.OR = [
          { firstName: { contains: input.searchQuery, mode: "insensitive" } },
          { lastName: { contains: input.searchQuery, mode: "insensitive" } },
          { email: { contains: input.searchQuery, mode: "insensitive" } },
          { phone: { contains: input.searchQuery, mode: "insensitive" } },
          { rut: { contains: input.searchQuery, mode: "insensitive" } },
        ];
      }

      const [patients, total] = await Promise.all([
        ctx.db.patient.findMany({
          where: whereClause,
          orderBy: [
            { firstName: "asc" },
            { lastName: "asc" }
          ],
          include: {
            _count: {
              select: { appointments: true },
            },
            appointments: {
              orderBy: { date: "desc" },
              take: 1,
            },
          },
          skip,
          take: limit,
        }),
        ctx.db.patient.count({ where: whereClause }),
      ]);

      return {
        patients,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  getLookupList: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.patient.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" }
      ],
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
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        rut: z.string().optional(),
        birthDate: z.date().optional(),
        notes: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.patient.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
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
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        rut: z.string().optional(),
        birthDate: z.date().optional(),
        notes: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.patient.update({
        where: { id: input.id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
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
