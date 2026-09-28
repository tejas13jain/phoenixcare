import { z } from 'zod';

const listDoctorsQuerySchema = z
  .object({
    q: z.string().trim().max(100, 'Search text is too long').optional(),
    specialty: z.string().trim().max(80, 'Specialty is too long').optional(),
    city: z.string().trim().max(80, 'City is too long').optional(),
    language: z.string().trim().max(40, 'Language is too long').optional(),
    mode: z.enum(['video', 'audio', 'chat', 'in_clinic'], {
      errorMap: () => ({ message: 'Choose a valid consultation mode' }),
    }).optional(),
    minFee: z.coerce.number({ invalid_type_error: 'Minimum fee must be a number' }).min(0, 'Minimum fee cannot be negative').optional(),
    maxFee: z.coerce.number({ invalid_type_error: 'Maximum fee must be a number' }).min(0, 'Maximum fee cannot be negative').optional(),
    minRating: z.coerce.number().min(0, 'Rating must be between 0 and 5').max(5, 'Rating must be between 0 and 5').optional(),
    minExperience: z.coerce.number().min(0, 'Experience cannot be negative').max(60, 'Enter a realistic number of years').optional(),
    sort: z.enum(['rating', 'fee_low', 'fee_high', 'experience'], {
      errorMap: () => ({ message: 'Choose a valid sort option' }),
    }).optional(),
    page: z.coerce.number().int('Page must be a whole number').min(1, 'Page must be at least 1').default(1),
    limit: z.coerce.number().int('Limit must be a whole number').min(1).max(50, 'Limit cannot exceed 50').default(12),
  })
  .refine((data) => data.minFee === undefined || data.maxFee === undefined || data.maxFee >= data.minFee, {
    message: 'Maximum fee cannot be lower than the minimum fee',
    path: ['maxFee'],
  });

export const listDoctorsSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: listDoctorsQuerySchema,
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
