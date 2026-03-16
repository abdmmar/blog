import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "src/content/blog" }),
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
  loader: glob({ pattern: "**/*.mdx", base: "src/content/project" }),
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
      repository: z.string().optional(),
      link: z.string(),
    }),
});

const photo = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "src/content/photo" }),
  schema: z.object({
    id: z.string(),
    filepath: z.string(),
    title: z.string(),
    alt: z.string().optional(),
    date: z.string().transform((str) => new Date(str)),
    author: z.string(),
    iso: z.string().optional(),
    shutterspeed: z.string().optional(),
    aperture: z.string().optional(),
    lens: z.string().optional(),
  }),
});

const singleSchema = z.object({
  type: z.literal("single"),
  title: z.string(),
  slug: z.string(),
  date: z.string().transform((str) => new Date(str)),
  coverImage: z.string(),
  alt: z.string().optional(),
  author: z.string().optional(),
  iso: z.string().optional(),
  shutterspeed: z.string().optional(),
  aperture: z.string().optional(),
  lens: z.string().optional(),
});

const albumSchema = z.object({
  type: z.literal("album"),
  title: z.string(),
  slug: z.string(),
  date: z.string().transform((str) => new Date(str)),
  coverImage: z.string(),
  description: z.string().optional(),
  images: z.array(
    z.object({
      src: z.string(),
      alt: z.string().optional(),
      caption: z.string().optional(),
    }),
  ),
});

const journalSchema = z.object({
  type: z.literal("journal"),
  title: z.string(),
  slug: z.string(),
  date: z.string().transform((str) => new Date(str)),
  coverImage: z.string(),
  description: z.string(),
  author: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

const photoGallery = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "src/content/photo-gallery" }),
  schema: z.discriminatedUnion("type", [
    singleSchema,
    albumSchema,
    journalSchema,
  ]),
});

export const collections = { blog, project, photo, photoGallery };
