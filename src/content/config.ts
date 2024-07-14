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
        heroImage: image(),
        preview: image().optional(),
        tags: z.array(z.string()).default([]).optional(),
        categories: z.array(z.string()).default([]).optional(),
      }),
  }),
  copy: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      pubDate: z.coerce.date(),
      updateDate: z.coerce.date(),
    })
  })
};
