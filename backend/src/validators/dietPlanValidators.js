import { z } from 'zod';

const objectId = (label) => z.string().length(24, `${label} must be a valid id`);

const mealSchema = z.object({
  mealType: z.enum(['early_morning', 'breakfast', 'mid_morning', 'lunch', 'evening_snack', 'dinner', 'bedtime'], {
    errorMap: () => ({ message: 'Choose a valid meal slot' }),
  }),
  items: z.array(z.string().trim().min(1, 'Meal item cannot be empty')).min(1, 'Add at least one food item'),
  calories: z.coerce.number().min(0, 'Calories cannot be negative').optional(),
  protein: z.coerce.number().min(0, 'Protein cannot be negative').optional(),
  notes: z.string().max(300, 'Notes must be under 300 characters').optional(),
});

const dietPlanBodySchema = z.object({
  patientId: objectId('Patient id'),
  appointmentId: objectId('Appointment id').optional(),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long'),
  goal: z.enum(['weight_loss', 'weight_gain', 'muscle_gain', 'general_wellness', 'diabetic_care', 'heart_health'], {
    errorMap: () => ({ message: 'Select a valid diet goal' }),
  }),
  targetCalories: z.coerce.number().min(0, 'Target calories cannot be negative').optional(),
  targetProtein: z.coerce.number().min(0, 'Target protein cannot be negative').optional(),
  meals: z.array(mealSchema).min(1, 'Add at least one meal to the plan'),
  hydrationTarget: z.string().max(100).optional(),
  restrictions: z.array(z.string().trim()).optional(),
  notes: z.string().max(1000, 'Notes must be under 1000 characters').optional(),
  startDate: z.coerce.date({ errorMap: () => ({ message: 'Start date is required and must be a valid date' }) }),
  endDate: z.coerce.date().optional(),
});

export const createDietPlanSchema = z.object({
  query: z.any(),
  params: z.any(),
  body: dietPlanBodySchema.refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: 'End date cannot be before the start date',
    path: ['endDate'],
  }),
});

export const updateDietPlanSchema = z.object({
  query: z.any(),
  params: z.object({ id: objectId('Diet plan id') }),
  body: dietPlanBodySchema.partial().extend({
    isActive: z.boolean().optional(),
  }),
});

export const dietPlanIdSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({ id: objectId('Diet plan id') }),
});
