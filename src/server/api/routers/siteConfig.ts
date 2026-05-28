import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const siteConfigRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ keys: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const configs = await ctx.db.siteConfig.findMany({
        where: {
          key: { in: input.keys },
        },
      });

      const configMap: Record<string, string> = {};
      configs.forEach((cfg) => {
        configMap[cfg.key] = cfg.value;
      });

      // Provide defaults for requested keys if they don't exist
      input.keys.forEach((k) => {
        if (!(k in configMap)) {
          if (k === "about_title") configMap[k] = "Quién Soy";
          else if (k === "about_description") {
            configMap[k] = "Kinesióloga especialista en disfunciones del suelo pélvico...";
          } else {
            configMap[k] = "";
          }
        }
      });

      return configMap;
    }),

  set: protectedProcedure
    .input(
      z.object({
        key: z.string().min(1),
        value: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.siteConfig.upsert({
        where: { key: input.key },
        update: { value: input.value },
        create: { key: input.key, value: input.value },
      });
    }),

  setMany: protectedProcedure
    .input(
      z.object({
        configs: z.array(
          z.object({
            key: z.string().min(1),
            value: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const operations = input.configs.map((cfg) =>
        ctx.db.siteConfig.upsert({
          where: { key: cfg.key },
          update: { value: cfg.value },
          create: { key: cfg.key, value: cfg.value },
        })
      );
      await Promise.all(operations);
      return { success: true };
    }),
});
