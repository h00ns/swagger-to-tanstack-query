import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const docs = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/docs" }),
  schema: z.object({
    /** Page title, shown as the h1 and in nav. */
    title: z.string(),
    /** One-line summary for SEO and nav tooltips. */
    description: z.string(),
    /** Sidebar group heading, e.g. "Getting Started". */
    group: z.string(),
    /** Sort order within the whole sidebar (lower first). */
    order: z.number(),
  }),
});

export const collections = { docs };
