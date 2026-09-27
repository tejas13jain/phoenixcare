import mongoose from 'mongoose';

const { Schema } = mongoose;

const medicationSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    times: [{ type: String, required: true }], // "HH:mm" 24h, one or more reminder times per day
    startDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String, default: null }, // YYYY-MM-DD, null = ongoing
    notes: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    // "HH:mm on YYYY-MM-DD" markers already notified, so the reminder sweep never double-sends
    // within the same minute window across restarts.
    lastNotifiedSlots: [{ type: String }],
  },
  { timestamps: true }
);

export const Medication = mongoose.model('Medication', medicationSchema);
