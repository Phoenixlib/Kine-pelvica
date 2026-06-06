import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// --- Helpers de Validación ---
const formatPhone = (phone: string): string | null => {
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  
  if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
    cleanPhone = '+56' + cleanPhone;
  } else if (cleanPhone.length === 11 && cleanPhone.startsWith('569')) {
    cleanPhone = '+' + cleanPhone;
  } else if (cleanPhone.length === 8) {
     cleanPhone = '+569' + cleanPhone;
  }
  
  if (/^\+569\d{8}$/.test(cleanPhone)) return cleanPhone;
  if (/^\+\d{10,15}$/.test(cleanPhone)) return cleanPhone;
  
  return null;
};

const phoneSchema = z.string()
  .min(1, "El teléfono es requerido")
  .refine(val => formatPhone(val) !== null, { message: "Formato de teléfono inválido" })
  .transform(val => formatPhone(val)!);
// -----------------------------

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
        firstName: z.string().min(1, "El nombre es requerido"),
        lastName: z.string().min(1, "El apellido es requerido"),
        email: z.string().email("Email inválido").optional().or(z.literal("")),
        phone: phoneSchema,
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingPatient = await ctx.db.patient.findFirst({
        where: {
          OR: [
            { phone: input.phone },
            {
              AND: [
                { firstName: { equals: input.firstName, mode: "insensitive" } },
                { lastName: { equals: input.lastName, mode: "insensitive" } }
              ]
            }
          ]
        }
      });

      if (existingPatient) {
        if (existingPatient.phone === input.phone) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ya existe un paciente con este número de teléfono",
          });
        } else {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ya existe un paciente con este mismo nombre y apellido",
          });
        }
      }

      return ctx.db.patient.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email || null,
          phone: input.phone,
          notes: input.notes || null,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string().min(1, "El nombre es requerido"),
        lastName: z.string().min(1, "El apellido es requerido"),
        email: z.string().email("Email inválido").optional().or(z.literal("")),
        phone: phoneSchema,
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingPatient = await ctx.db.patient.findFirst({
        where: {
          id: { not: input.id },
          OR: [
            { phone: input.phone },
            {
              AND: [
                { firstName: { equals: input.firstName, mode: "insensitive" } },
                { lastName: { equals: input.lastName, mode: "insensitive" } }
              ]
            }
          ]
        }
      });

      if (existingPatient) {
        if (existingPatient.phone === input.phone) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ya existe otro paciente con este número de teléfono",
          });
        } else {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ya existe otro paciente con este mismo nombre y apellido",
          });
        }
      }

      return ctx.db.patient.update({
        where: { id: input.id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email || null,
          phone: input.phone,
          notes: input.notes || null,
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
