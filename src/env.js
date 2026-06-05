import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string(),
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    SANITY_API_TOKEN: z.string().optional(),
    CALCOM_WEBHOOK_SECRET: z.string().optional(),
    CALCOM_API_KEY: z.string().optional(),
    CALCOM_API_URL: z.string().optional(),
    CALCOM_SCHEDULE_ID: z.string().optional(),
    CALCOM_EVENT_TYPE_ID: z.string().optional(),
    CALCOM_FALLBACK_EVENT_TYPE_ID: z.string().optional(),
    GOOGLE_CALENDAR_CLIENT_ID: z.string().optional(),
    GOOGLE_CALENDAR_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALENDAR_REFRESH_TOKEN: z.string().optional(),
    GOOGLE_PLACES_API_KEY: z.string().optional(),
    GOOGLE_PLACE_ID: z.string().optional(),
    GOOGLE_REVIEW_URL: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().optional(),
    NEXT_PUBLIC_SANITY_DATASET: z.string().optional(),
    NEXT_PUBLIC_GOOGLE_PLACE_ID: z.string().optional(),
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
    NEXT_PUBLIC_CALCOM_ADMIN_URL: z.string().url().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    SANITY_API_TOKEN: process.env.SANITY_API_TOKEN,
    CALCOM_WEBHOOK_SECRET: process.env.CALCOM_WEBHOOK_SECRET,
    CALCOM_API_KEY: process.env.CALCOM_API_KEY,
    CALCOM_API_URL: process.env.CALCOM_API_URL,
    CALCOM_SCHEDULE_ID: process.env.CALCOM_SCHEDULE_ID,
    CALCOM_EVENT_TYPE_ID: process.env.CALCOM_EVENT_TYPE_ID,
    CALCOM_FALLBACK_EVENT_TYPE_ID: process.env.CALCOM_FALLBACK_EVENT_TYPE_ID,
    GOOGLE_CALENDAR_CLIENT_ID: process.env.GOOGLE_CALENDAR_CLIENT_ID,
    GOOGLE_CALENDAR_CLIENT_SECRET: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    GOOGLE_CALENDAR_REFRESH_TOKEN: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    GOOGLE_PLACE_ID: process.env.GOOGLE_PLACE_ID,
    GOOGLE_REVIEW_URL: process.env.GOOGLE_REVIEW_URL,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    NEXT_PUBLIC_GOOGLE_PLACE_ID: process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CALCOM_ADMIN_URL: process.env.NEXT_PUBLIC_CALCOM_ADMIN_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
