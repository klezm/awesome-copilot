import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const chatmodes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../chatmodes' }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    model: z.string().optional(),
  }),
});

const instructions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../instructions' }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    applyTo: z.union([z.string(), z.array(z.string())]).optional(),
  }),
});

const prompts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../prompts' }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    mode: z.string().optional(),
    model: z.string().optional(),
  }),
});

export const collections = {
  chatmodes,
  instructions,
  prompts,
};
