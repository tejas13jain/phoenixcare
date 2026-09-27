import { z } from 'zod';

export const logVitalsSchema = z.object({
  query: z.any(),
  params: z.any(),
  body: z
    .object({
      bloodPressureSystolic: z.number().min(50, 'Systolic reading looks too low').max(260, 'Systolic reading looks too high').optional(),
      bloodPressureDiastolic: z.number().min(30, 'Diastolic reading looks too low').max(180, 'Diastolic reading looks too high').optional(),
      pulse: z.number().min(20, 'Pulse looks too low').max(240, 'Pulse looks too high').optional(),
      spo2: z.number().min(50, 'SpO2 looks too low').max(100, 'SpO2 cannot exceed 100%').optional(),
      temperature: z.number().min(30, 'Temperature looks too low').max(45, 'Temperature looks too high').optional(),
      bloodSugar: z.number().min(20, 'Blood sugar looks too low').max(600, 'Blood sugar looks too high').optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'Enter at least one vital reading' }),
});

export const logMoodSchema = z.object({
  query: z.any(),
  params: z.any(),
  body: z.object({
    mood: z.enum(['great', 'good', 'okay', 'low', 'struggling'], {
      errorMap: () => ({ message: 'Please select how you are feeling' }),
    }),
    stressLevel: z.number().int().min(1).max(5).optional(),
    note: z.string().max(500, 'Note must be under 500 characters').optional(),
  }),
});

export const setGoalSchema = z.object({
  query: z.any(),
  params: z.object({
    type: z.enum(['water', 'steps', 'sleep', 'weight_target'], {
      errorMap: () => ({ message: 'Unknown goal type' }),
    }),
  }),
  body: z.object({
    targetValue: z.number().positive('Target must be a positive number'),
  }),
});
