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
        const query = input.searchQuery.trim();
        const words = query.split(/\s+/).filter(Boolean);

        if (words.length === 1) {
          whereClause.OR = [
            { firstName: { contains: words[0], mode: "insensitive" as const } },
            { lastName: { contains: words[0], mode: "insensitive" as const } },
            { email: { contains: words[0], mode: "insensitive" as const } },
            { phone: { contains: words[0], mode: "insensitive" as const } },
          ];
        } else if (words.length > 1) {
          whereClause.AND = words.map((word) => ({
            OR: [
              { firstName: { contains: word, mode: "insensitive" as const } },
              { lastName: { contains: word, mode: "insensitive" as const } },
              { email: { contains: word, mode: "insensitive" as const } },
              { phone: { contains: word, mode: "insensitive" as const } },
            ],
          }));
        }
      }

      // Obtener todos los pacientes que coinciden con el filtro para ordenarlos en memoria de forma insensible a mayúsculas/minúsculas y acentos.
      const allMatching = await ctx.db.patient.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });

      // Ordenar en memoria usando localeCompare (específico para español)
      allMatching.sort((a, b) => {
        const compareFirst = a.firstName.localeCompare(b.firstName, "es", { sensitivity: "base", numeric: true });
        if (compareFirst !== 0) return compareFirst;
        return a.lastName.localeCompare(b.lastName, "es", { sensitivity: "base", numeric: true });
      });

      const total = allMatching.length;
      const paginatedIds = allMatching.slice(skip, skip + limit).map((p) => p.id);

      // Si no hay IDs paginados, devolvemos la lista vacía
      if (paginatedIds.length === 0) {
        return {
          patients: [],
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      }

      // Obtener los registros completos de la página actual
      const pagePatients = await ctx.db.patient.findMany({
        where: {
          id: { in: paginatedIds },
        },
        include: {
          _count: {
            select: { appointments: true },
          },
          appointments: {
            orderBy: { date: "desc" },
            take: 1,
          },
        },
      });

      // Re-ordenar según el orden de paginatedIds (orden alfabético ya calculado)
      const patients = paginatedIds
        .map((id) => pagePatients.find((p) => p.id === id)!)
        .filter(Boolean);

      return {
        patients,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  getLookupList: protectedProcedure.query(async ({ ctx }) => {
    const patients = await ctx.db.patient.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    return patients.sort((a, b) => {
      const compareFirst = a.firstName.localeCompare(b.firstName, "es", { sensitivity: "base", numeric: true });
      if (compareFirst !== 0) return compareFirst;
      return a.lastName.localeCompare(b.lastName, "es", { sensitivity: "base", numeric: true });
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
