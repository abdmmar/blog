import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      tag: z.enum(["Blog"]),
      status: z.string(),
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
      keywords: z.array(z.string()).optional(),
      author: z.string().optional(),
    }),
});

const project = defineCollection({
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      tag: z.enum(["Project"]),
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
      keywords: z.array(z.string()).optional(),
      author: z.string().optional(),
      repository: z.string(),
      link: z.string(),
    }),
});

const photo = defineCollection({
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      publishedAt: z
        .string()
        .or(z.date())
        .transform((val) => new Date(val)),
      image: image(),
      tag: z.enum(["Photography"]),
    }),
});

export const collections = { blog, project, photo };
