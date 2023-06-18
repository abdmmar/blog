import { defineCollection, z } from "astro:content";

interface ImageMetadata {
  src: string;
  width: number;
  height: number;
  format: string;
}

const blog = defineCollection({
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      tag: z.string(),
      status: z.string(),
      // Transform string to Date object
      publishedAt: z
        .string()
        .or(z.date())
        .transform((val) => new Date(val)),
      updatedAt: z
        .string()
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
      image: image().optional(),
      imageAlt: z.string().optional(),
      keywords: z.array(z.string()),
      author: z.string(),
    }),
});

export const collections = { blog };
