import { z } from 'zod';

export const createHealthRecordSchema = z.object({
  query: z.any(),
  params: z.any(),
  body: z.object({
    type: z.enum(['lab_report', 'prescription', 'vitals', 'scan', 'other']),
    title: z.string().min(1).max(200),
    fileUrl: z.string().url().optional(),
    familyMemberId: z.string().length(24).optional().nullable(),
    vitals: z
      .object({
        bloodPressure: z.string().optional(),
        pulse: z.number().optional(),
        spo2: z.number().optional(),
        temperature: z.number().optional(),
        bloodSugar: z.number().optional(),
        weight: z.number().optional(),
      })
      .optional(),
  }),
});
