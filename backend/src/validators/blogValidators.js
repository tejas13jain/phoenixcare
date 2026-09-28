import { z } from 'zod';

const CATEGORIES = ['hydration', 'nutrition', 'movement', 'sleep', 'mental_health', 'preventive_care', 'general'];

const blogBodySchema = z.object({
  title: z.string().trim().min(8, 'Title must be at least 8 characters').max(160, 'Title must be under 160 characters'),
  excerpt: z
    .string()
    .trim()
    .min(20, 'Excerpt must be at least 20 characters')
    .max(280, 'Excerpt must be under 280 characters'),
  content: z.string().trim().min(100, 'Post content must be at least 100 characters'),
  coverImageUrl: z.string().trim().url('Cover image must be a valid URL').optional().or(z.literal('')),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Select a valid category' }) }).default('general'),
  tags: z.array(z.string().trim().min(1)).max(10, 'Add at most 10 tags').optional(),
  readTimeMinutes: z.coerce.number().min(1).max(60).optional(),
});

export const createBlogSchema = z.object({
  query: z.any(),
  params: z.any(),
  body: blogBodySchema,
});

export const updateBlogSchema = z.object({
  query: z.any(),
  params: z.object({ id: z.string().length(24, 'Invalid blog post id') }),
  body: blogBodySchema.partial(),
});

export const blogIdSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({ id: z.string().length(24, 'Invalid blog post id') }),
});

export const blogSlugSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({ slug: z.string().trim().min(1, 'Slug is required') }),
});

export const listBlogsSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    q: z.string().trim().optional(),
    category: z.enum(CATEGORIES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(30).default(9),
  }),
});
