import { z } from 'zod';

export const chatSchema = z.object({
  query: z.any(),
  params: z.any(),
  body: z.object({
    messages: z
      .array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string().trim().min(1, 'Message is empty').max(1500, 'Message is too long (max 1500 characters)'),
        })
      )
      .min(1)
      .max(30),
    lastShown: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(6).optional(),
  }),
});
