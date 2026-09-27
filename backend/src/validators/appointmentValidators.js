import { z } from 'zod';

export const createAppointmentSchema = z.object({
  query: z.any(),
  params: z.any(),
  body: z.object({
    doctorId: z.string().length(24),
    slotId: z.string().length(24),
    mode: z.enum(['video', 'audio', 'chat', 'in_clinic']),
    familyMemberId: z.string().length(24).optional().nullable(),
    intakeForm: z
      .object({
        symptoms: z.string().max(2000).default(''),
        durationDays: z.number().int().min(0).optional(),
        vitals: z
          .object({
            temperature: z.number().optional(),
            bloodPressure: z.string().optional(),
            pulse: z.number().optional(),
            spo2: z.number().optional(),
          })
          .optional(),
        attachments: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
        notes: z.string().max(2000).optional(),
      })
      .optional(),
  }),
});

export const listAppointmentsSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    status: z
      .enum(['pending_payment', 'confirmed', 'waiting_room', 'in_progress', 'completed', 'cancelled', 'no_show'])
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

export const appointmentIdSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({ id: z.string().length(24) }),
});

export const cancelAppointmentSchema = z.object({
  query: z.any(),
  params: z.object({ id: z.string().length(24) }),
  body: z.object({ reason: z.string().max(500).optional() }),
});
