import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const listSlotsSchema = z.object({
  body: z.any(),
  params: z.object({ doctorId: z.string().min(2) }),
  query: z.object({
    date: z.string().regex(dateRegex).optional(),
    from: z.string().regex(dateRegex).optional(),
    to: z.string().regex(dateRegex).optional(),
    mode: z.enum(['video', 'audio', 'chat', 'in_clinic']).optional(),
  }),
});

export const generateSlotsSchema = z.object({
  params: z.object({ doctorId: z.string().min(2) }),
  query: z.any(),
  body: z.object({
    dates: z.array(z.string().regex(dateRegex)).min(1),
    startTime: z.string().regex(timeRegex),
    endTime: z.string().regex(timeRegex),
    slotDurationMinutes: z.number().int().min(5).max(120).default(15),
    modes: z.array(z.enum(['video', 'audio', 'chat', 'in_clinic'])).min(1),
  }),
});

export const slotIdParamSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    doctorId: z.string().min(2),
    slotId: z.string().length(24, 'Invalid slot id'),
  }),
});
