import { z } from 'zod';

export const createOrderSchema = z.object({
  query: z.any(),
  params: z.any(),
  body: z.object({ appointmentId: z.string().length(24) }),
});

export const verifyPaymentSchema = z.object({
  query: z.any(),
  params: z.any(),
  body: z.object({
    appointmentId: z.string().length(24),
    razorpayOrderId: z.string().min(3),
    razorpayPaymentId: z.string().min(3),
    razorpaySignature: z.string().min(3),
  }),
});
