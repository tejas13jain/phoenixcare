import mongoose from 'mongoose';

const { Schema } = mongoose;

const healthGoalSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    type: { type: String, enum: ['water', 'steps', 'sleep', 'weight_target'], required: true },
    targetValue: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

healthGoalSchema.index({ patient: 1, type: 1 }, { unique: true });

export const HealthGoal = mongoose.model('HealthGoal', healthGoalSchema);
