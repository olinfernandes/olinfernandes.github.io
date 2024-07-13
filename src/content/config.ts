import { defineCollection, z } from 'astro:content';

export const collections = {
  blog: defineCollection({
    type: "content",
    // Type-check frontmatter using a schema
    schema: ({ image }) =>
      z.object({
        title: z.string(),
        description: z.string(),
        // Transform string to Date object
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: image(),
        preview: image().optional(),
      }),
  }),
};
