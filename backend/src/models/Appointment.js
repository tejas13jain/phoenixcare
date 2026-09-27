import mongoose from 'mongoose';

const { Schema } = mongoose;

const appointmentSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    slot: { type: Schema.Types.ObjectId, ref: 'Slot', required: true },
    familyMemberId: { type: Schema.Types.ObjectId, default: null },
    mode: { type: String, enum: ['video', 'audio', 'chat', 'in_clinic'], required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    intakeForm: {
      symptoms: { type: String, default: '' },
      durationDays: { type: Number },
      vitals: {
        temperature: Number,
        bloodPressure: String,
        pulse: Number,
        spo2: Number,
      },
      attachments: [{ label: String, url: String }],
      notes: { type: String, default: '' },
    },
    fee: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        'pending_payment',
        'confirmed',
        'waiting_room',
        'in_progress',
        'completed',
        'cancelled',
        'no_show',
      ],
      default: 'pending_payment',
      index: true,
    },
    roomId: { type: String, index: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
    prescription: { type: Schema.Types.ObjectId, ref: 'Prescription', default: null },
    cancelledBy: { type: String, enum: ['patient', 'doctor', 'admin', null], default: null },
    cancellationReason: { type: String },
    doctorNotes: { type: String, default: '' },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, date: 1, status: 1 });
appointmentSchema.index({ patient: 1, status: 1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
