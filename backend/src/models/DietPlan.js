import mongoose from 'mongoose';

const { Schema } = mongoose;

const mealSchema = new Schema(
  {
    mealType: {
      type: String,
      enum: ['early_morning', 'breakfast', 'mid_morning', 'lunch', 'evening_snack', 'dinner', 'bedtime'],
      required: true,
    },
    items: [{ type: String, required: true }],
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const dietPlanSchema = new Schema(
  {
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    title: { type: String, required: true, trim: true },
    goal: {
      type: String,
      enum: ['weight_loss', 'weight_gain', 'muscle_gain', 'general_wellness', 'diabetic_care', 'heart_health'],
      required: true,
    },
    targetCalories: { type: Number, min: 0 },
    targetProtein: { type: Number, min: 0 },
    meals: { type: [mealSchema], default: [] },
    hydrationTarget: { type: String, default: '' },
    restrictions: [{ type: String }],
    notes: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

dietPlanSchema.index({ patient: 1, isActive: 1, createdAt: -1 });

export const DietPlan = mongoose.model('DietPlan', dietPlanSchema);
