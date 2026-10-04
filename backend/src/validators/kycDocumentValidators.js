import { z } from 'zod';
import { KYC_DOCUMENT_TYPE_IDS } from '../constants/kycDocuments.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const docType = z.enum(KYC_DOCUMENT_TYPE_IDS, { errorMap: () => ({ message: 'Unknown document type' }) });

export const myDocumentSchema = z.object({
  query: z.any(),
  body: z.any(),
  params: z.object({ docType }),
});

export const doctorDocumentsSchema = z.object({
  query: z.any(),
  body: z.any(),
  params: z.object({ id: objectId }),
});

export const doctorDocumentSchema = z.object({
  query: z.any(),
  body: z.any(),
  params: z.object({ id: objectId, docType }),
});

export const reviewDocumentSchema = z.object({
  query: z.any(),
  params: z.object({ id: objectId, docType }),
  body: z
    .object({
      status: z.enum(['approved', 'rejected']),
      reason: z.string().trim().max(300, 'Reason must be under 300 characters').optional(),
    })
    .refine((b) => b.status !== 'rejected' || (b.reason && b.reason.length >= 3), {
      message: 'Please tell the doctor why the document was rejected',
      path: ['reason'],
    }),
});
