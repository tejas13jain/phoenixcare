import mongoose from 'mongoose';

const { Schema } = mongoose;

const vitalsLogSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    bloodPressureSystolic: { type: Number, min: 50, max: 260 },
    bloodPressureDiastolic: { type: Number, min: 30, max: 180 },
    pulse: { type: Number, min: 20, max: 240 },
    spo2: { type: Number, min: 50, max: 100 },
    temperature: { type: Number, min: 30, max: 45 }, // Celsius
    bloodSugar: { type: Number, min: 20, max: 600 }, // mg/dL
  },
  { timestamps: true }
);

vitalsLogSchema.index({ patient: 1, date: 1 }, { unique: true });

export const VitalsLog = mongoose.model('VitalsLog', vitalsLogSchema);
