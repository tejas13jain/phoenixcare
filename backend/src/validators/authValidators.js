import { z } from 'zod';

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number with country code');

export const signupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name is too short').max(80),
    email: z.string().trim().email('Enter a valid email'),
    phone: phoneSchema,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[0-9]/, 'Password must contain a number'),
    role: z.enum(['patient', 'doctor']).default('patient'),
  }),
  query: z.any(),
  params: z.any(),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3, 'Enter your email or phone'),
    password: z.string().min(1, 'Password is required'),
  }),
  query: z.any(),
  params: z.any(),
});

export const requestOtpSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3),
    channel: z.enum(['email', 'sms', 'whatsapp']).default('sms'),
    purpose: z.enum(['signup', 'login', 'reset_password']).default('login'),
  }),
  query: z.any(),
  params: z.any(),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3),
    code: z.string().length(6, 'OTP must be 6 digits'),
    purpose: z.enum(['signup', 'login', 'reset_password']).default('login'),
  }),
  query: z.any(),
  params: z.any(),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
  query: z.any(),
  params: z.any(),
});
