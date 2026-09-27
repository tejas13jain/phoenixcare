import mongoose from 'mongoose';

const { Schema } = mongoose;

const activityLogSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    steps: { type: Number, default: 0, min: 0 },
    activeMinutes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

activityLogSchema.index({ patient: 1, date: 1 }, { unique: true });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
