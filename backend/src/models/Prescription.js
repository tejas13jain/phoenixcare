import mongoose from 'mongoose';

const { Schema } = mongoose;

const medicineSchema = new Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    durationDays: { type: Number, required: true },
    instructions: { type: String, default: '' },
  },
  { _id: false }
);

const prescriptionSchema = new Schema(
  {
    appointment: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    diagnosis: [{ type: String }],
    medicines: [medicineSchema],
    labTestsAdvised: [{ type: String }],
    advice: { type: String, default: '' },
    followUpDate: { type: Date },
    pdfUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Prescription = mongoose.model('Prescription', prescriptionSchema);
