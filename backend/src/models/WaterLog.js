import mongoose from 'mongoose';

const { Schema } = mongoose;

const waterLogSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD, patient's local date
    glasses: { type: Number, default: 0, min: 0 },
    goal: { type: Number, default: 8 },
  },
  { timestamps: true }
);

waterLogSchema.index({ patient: 1, date: 1 }, { unique: true });

export const WaterLog = mongoose.model('WaterLog', waterLogSchema);
