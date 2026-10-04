import { z } from 'zod';
import { E164_PATTERN, normalizePhone } from '../utils/phone.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const modes = z.array(z.enum(['video', 'audio', 'chat', 'in_clinic'])).min(1, 'Choose at least one consultation mode');
const fee = z.object({
  video: z.coerce.number().min(0).optional(),
  audio: z.coerce.number().min(0).optional(),
  chat: z.coerce.number().min(0).optional(),
  in_clinic: z.coerce.number().min(0).optional(),
});

// Profile fields an admin can set when onboarding or editing a doctor.
const profileFields = {
  specialties: z.array(z.string().trim().min(2)).min(1, 'Choose at least one specialty'),
  registrationNumber: z.string().trim().min(3, 'Registration number is required').max(60),
  registrationCouncil: z.string().trim().max(120).optional(),
  qualifications: z.array(z.string().trim().min(1).max(80)).max(15).optional(),
  experienceYears: z.coerce.number().min(0).max(70, 'Enter a realistic number of years').optional(),
  bio: z.string().trim().max(2000).optional(),
  languages: z.array(z.string().trim().min(1).max(40)).max(15).optional(),
  consultationModes: modes.optional(),
  fee: fee.optional(),
  clinicAddress: z.string().trim().max(300).optional(),
  city: z.string().trim().max(60).optional(),
  isAcceptingNewPatients: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  kycStatus: z.enum(['pending', 'under_review', 'verified', 'rejected']).optional(),
};

export const createDoctorSchema = z.object({
  query: z.any(),
  params: z.any(),
  body: z.object({
    name: z.string().trim().min(2, 'Name is too short').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    phone: z
      .string()
      .trim()
      .transform(normalizePhone)
      .pipe(z.string().regex(E164_PATTERN, 'Enter a valid mobile number, for example 98765 43210 or +91 98765 43210')),
    ...profileFields,
  }),
});

export const updateDoctorByAdminSchema = z.object({
  query: z.any(),
  params: z.object({ id: objectId }),
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    ...profileFields,
  }).partial(),
});

export const searchDoctorsSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    q: z.string().trim().max(100, 'Search text is too long').optional(),
    specialty: z.string().trim().max(80).optional(),
    city: z.string().trim().max(60).optional(),
    kycStatus: z.enum(['pending', 'under_review', 'verified', 'rejected']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export const doctorIdParamSchema = z.object({ query: z.any(), body: z.any(), params: z.object({ id: objectId }) });
