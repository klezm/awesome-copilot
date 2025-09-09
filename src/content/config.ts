import { z, defineCollection } from 'astro:content';

const promptsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional(),
    description: z.string(),
    mode: z.string().optional(),
    id: z.string().optional(),
  }),
});

const instructionsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional(),
    description: z.string(),
    id: z.string().optional(),
  }),
});

const chatmodesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional(),
    description: z.string(),
    id: z.string().optional(),
  }),
});

export const collections = {
  prompts: promptsCollection,
  instructions: instructionsCollection,
  chatmodes: chatmodesCollection,
};
