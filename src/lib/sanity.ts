import { env } from "~/env";
import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder",
  dataset: env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-03-11",
  useCdn: env.NODE_ENV === "production",
  token: env.SANITY_API_TOKEN,
});
