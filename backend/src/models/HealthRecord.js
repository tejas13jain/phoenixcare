import mongoose from 'mongoose';

const { Schema } = mongoose;

const healthRecordSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    familyMemberId: { type: Schema.Types.ObjectId, default: null },
    type: {
      type: String,
      enum: ['lab_report', 'prescription', 'vitals', 'scan', 'other'],
      required: true,
    },
    title: { type: String, required: true },
    fileUrl: { type: String },
    vitals: {
      recordedAt: Date,
      bloodPressure: String,
      pulse: Number,
      spo2: Number,
      temperature: Number,
      bloodSugar: Number,
      weight: Number,
    },
    sourceAppointment: { type: Schema.Types.ObjectId, ref: 'Appointment', default: null },
  },
  { timestamps: true }
);

export const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);
