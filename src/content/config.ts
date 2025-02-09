import { defineCollection, z } from 'astro:content';

export const collections = {
  blog: defineCollection({
    type: "content",
    schema: ({ image }) =>
      z.object({
        title: z.string(),
        description: z.string(),
        draft: z.boolean().default(false).optional(),
        pubDate: z.coerce.date(),
        updateDate: z.coerce.date().optional(),
        heroImage: image().optional(),
        preview: image().optional(),
        tags: z.array(z.string()).optional(),
        categories: z.array(z.string()).optional(),
      }),
  }),
  copy: defineCollection({
    type: "content",
    schema: ({ image }) => z.object({
      title: z.string(),
      pubDate: z.coerce.date(),
      updateDate: z.coerce.date(),
      draft: z.boolean().default(false).optional(),
      heroImage: image().optional(),
      preview: image().optional(),
    }),
  }),
  testimonials: defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      href: z.string().url(),
      author: z.string(),
      designation: z.string(),
      pubDate: z.date().default(new Date()),
      relation: z.string(),
      avatar: image(),
    }),
}),
};
