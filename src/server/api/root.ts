import { statsRouter } from "~/server/api/routers/stats";
import { patientRouter } from "~/server/api/routers/patient";
import { appointmentRouter } from "~/server/api/routers/appointment";
import { serviceRouter } from "~/server/api/routers/service";
import { siteConfigRouter } from "~/server/api/routers/siteConfig";
import { galleryRouter } from "~/server/api/routers/gallery";
import { communityMessageRouter } from "~/server/api/routers/communityMessage";
import { blockedSlotRouter } from "~/server/api/routers/blockedSlot";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  stats: statsRouter,
  patient: patientRouter,
  appointment: appointmentRouter,
  service: serviceRouter,
  siteConfig: siteConfigRouter,
  gallery: galleryRouter,
  communityMessage: communityMessageRouter,
  blockedSlot: blockedSlotRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
