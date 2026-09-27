import mongoose from 'mongoose';

const { Schema } = mongoose;

const weightLogSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    weight: { type: Number, required: true, min: 1 }, // kg
  },
  { timestamps: true }
);

weightLogSchema.index({ patient: 1, date: 1 }, { unique: true });

export const WeightLog = mongoose.model('WeightLog', weightLogSchema);
