import { z } from 'zod';
import { ENQUIRY_STATUSES } from '../models/SurgeryEnquiry.js';

export const createSurgeryEnquirySchema = z.object({
  query: z.any(),
  params: z.any(),
  body: z.object({
    name: z.string().trim().min(2, 'Please enter your name').max(80, 'Name is too long'),
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s-]/g, ''))
      // Allow a leading 0 — many people type their number as 098765 43210.
      .pipe(z.string().regex(/^\+?\d{8,15}$/, 'Please enter a valid phone number')),
    city: z.string().trim().min(2, 'Please enter your city').max(60, 'City is too long'),
    procedure: z.string().trim().min(2, 'Please choose a procedure').max(80, 'Procedure is too long'),
    notes: z.string().trim().max(500, 'Notes must be under 500 characters').optional(),
  }),
});

export const listSurgeryEnquiriesSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({ status: z.enum(ENQUIRY_STATUSES).optional() }),
});

export const updateSurgeryEnquiryStatusSchema = z.object({
  query: z.any(),
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid enquiry id') }),
  body: z.object({ status: z.enum(ENQUIRY_STATUSES) }),
});
