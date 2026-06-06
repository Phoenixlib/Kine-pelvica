import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schema } from "./src/sanity/schema";

export default defineConfig({
  name: "default",
  title: "Estudio Pélvico - Blog Admin",

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "paglpmnm",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",

  basePath: "/admin/blog-studio",

  plugins: [structureTool()],

  schema: {
    types: schema.types,
  },
});
