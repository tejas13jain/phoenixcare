import mongoose from 'mongoose';

const { Schema } = mongoose;

const slotSchema = new Schema(
  {
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD (doctor's local clinic date)
    startTime: { type: String, required: true }, // HH:mm 24h
    endTime: { type: String, required: true },
    modes: [{ type: String, enum: ['video', 'audio', 'chat', 'in_clinic'] }],
    status: {
      type: String,
      enum: ['available', 'booked', 'blocked'],
      default: 'available',
      index: true,
    },
  },
  { timestamps: true }
);

slotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

export const Slot = mongoose.model('Slot', slotSchema);
