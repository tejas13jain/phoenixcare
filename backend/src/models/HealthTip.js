import mongoose from 'mongoose';

const { Schema } = mongoose;

const healthTipSchema = new Schema(
  {
    category: {
      type: String,
      enum: ['hydration', 'nutrition', 'movement', 'sleep', 'mental_health', 'preventive_care'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    icon: { type: String, default: 'sparkles' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const HealthTip = mongoose.model('HealthTip', healthTipSchema);
