import { z } from 'zod';

export const createPrescriptionSchema = z.object({
  query: z.any(),
  params: z.any(),
  body: z.object({
    appointmentId: z.string().length(24),
    diagnosis: z.array(z.string()).default([]),
    medicines: z
      .array(
        z.object({
          name: z.string().min(1),
          dosage: z.string().min(1),
          frequency: z.string().min(1),
          durationDays: z.number().int().min(1),
          instructions: z.string().optional(),
        })
      )
      .default([]),
    labTestsAdvised: z.array(z.string()).default([]),
    advice: z.string().max(2000).optional(),
    followUpDate: z.coerce.date().optional(),
  }),
});

export const prescriptionIdSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({ id: z.string().length(24) }),
});
