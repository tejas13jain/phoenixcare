import { z } from 'zod';

export const listDoctorsSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    q: z.string().trim().optional(),
    specialty: z.string().trim().optional(),
    city: z.string().trim().optional(),
    language: z.string().trim().optional(),
    mode: z.enum(['video', 'audio', 'chat', 'in_clinic']).optional(),
    minFee: z.coerce.number().min(0).optional(),
    maxFee: z.coerce.number().min(0).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    sort: z.enum(['rating', 'fee_low', 'fee_high', 'experience']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  }),
});

export const doctorIdSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({ id: z.string().length(24, 'Invalid doctor id') }),
});

export const updateDoctorProfileSchema = z.object({
  query: z.any(),
  params: z.any(),
  body: z.object({
    specialties: z.array(z.string()).min(1).optional(),
    qualifications: z.array(z.string()).optional(),
    experienceYears: z.number().min(0).optional(),
    bio: z.string().max(2000).optional(),
    languages: z.array(z.string()).optional(),
    consultationModes: z.array(z.enum(['video', 'audio', 'chat', 'in_clinic'])).optional(),
    fee: z
      .object({
        video: z.number().min(0).optional(),
        audio: z.number().min(0).optional(),
        chat: z.number().min(0).optional(),
        in_clinic: z.number().min(0).optional(),
      })
      .optional(),
    clinicAddress: z.string().optional(),
    city: z.string().optional(),
    isAcceptingNewPatients: z.boolean().optional(),
  }),
});
