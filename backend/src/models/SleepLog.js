import mongoose from 'mongoose';

const { Schema } = mongoose;

const sleepLogSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD — the morning this sleep is logged for
    hours: { type: Number, required: true, min: 0, max: 24 },
    quality: { type: String, enum: ['poor', 'fair', 'good', 'excellent'], default: 'fair' },
  },
  { timestamps: true }
);

sleepLogSchema.index({ patient: 1, date: 1 }, { unique: true });

export const SleepLog = mongoose.model('SleepLog', sleepLogSchema);
