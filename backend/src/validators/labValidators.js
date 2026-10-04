import { z } from 'zod';
import { LAB_ACCREDITATIONS, LAB_TEST_CATEGORIES } from '../models/Lab.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const labTestSchema = z
  .object({
    _id: objectId.optional(),
    name: z.string().trim().min(2, 'Test name is required').max(120, 'Test name is too long'),
    category: z.enum(LAB_TEST_CATEGORIES).default('other'),
    price: z.coerce.number({ invalid_type_error: 'Price must be a number' }).min(0, 'Price cannot be negative'),
    offerPrice: z.coerce.number().min(0, 'Offer price cannot be negative').optional().nullable(),
    sampleType: z.string().trim().max(60).optional(),
    preparation: z.string().trim().max(200).optional(),
    reportHours: z.coerce.number().min(0).max(720, 'Report time looks too long').optional(),
    homeCollection: z.boolean().optional(),
  })
  .refine((t) => t.offerPrice == null || t.offerPrice <= t.price, {
    message: 'Offer price cannot be higher than the price',
    path: ['offerPrice'],
  });

const labBody = z.object({
  name: z.string().trim().min(2, 'Lab name is required').max(120, 'Lab name is too long'),
  licenseNumber: z.string().trim().min(3, 'License number is required').max(60),
  accreditations: z.array(z.enum(LAB_ACCREDITATIONS)).max(LAB_ACCREDITATIONS.length).optional(),
  contactPerson: z.string().trim().max(80).optional(),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]).optional(),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ''))
    // Labs often list landlines with a leading 0 (e.g. 080 4000 1234), so allow it here.
    .pipe(z.string().regex(/^\+?\d{8,15}$/, 'Enter a valid phone number')),
  address: z.string().trim().min(5, 'Address is required').max(300),
  city: z.string().trim().min(2, 'City is required').max(60),
  pincode: z.string().trim().max(10).optional(),
  operatingHours: z.string().trim().max(80).optional(),
  homeCollection: z.boolean().optional(),
  homeCollectionFee: z.coerce.number().min(0, 'Fee cannot be negative').optional(),
  description: z.string().trim().max(1000).optional(),
  tests: z.array(labTestSchema).max(300, 'At most 300 tests per lab').optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const createLabSchema = z.object({ query: z.any(), params: z.any(), body: labBody });

export const updateLabSchema = z.object({
  query: z.any(),
  params: z.object({ id: objectId }),
  body: labBody.partial(),
});

export const labIdSchema = z.object({ query: z.any(), body: z.any(), params: z.object({ id: objectId }) });

const searchQuery = {
  q: z.string().trim().max(100, 'Search text is too long').optional(),
  city: z.string().trim().max(60).optional(),
  category: z.enum(LAB_TEST_CATEGORIES).optional(),
  homeCollection: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
};

export const listLabsSchema = z.object({ body: z.any(), params: z.any(), query: z.object(searchQuery) });

export const adminListLabsSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    ...searchQuery,
    status: z.enum(['active', 'inactive']).optional(),
    accreditation: z.enum(LAB_ACCREDITATIONS).optional(),
  }),
});
