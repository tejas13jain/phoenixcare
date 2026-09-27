import mongoose from 'mongoose';

const { Schema } = mongoose;

const moodLogSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    mood: { type: String, enum: ['great', 'good', 'okay', 'low', 'struggling'], required: true },
    stressLevel: { type: Number, min: 1, max: 5 }, // 1 = calm, 5 = very stressed
    note: { type: String, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

moodLogSchema.index({ patient: 1, date: 1 }, { unique: true });

export const MoodLog = mongoose.model('MoodLog', moodLogSchema);
