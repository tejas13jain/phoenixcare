import mongoose from 'mongoose';

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointment: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', maxlength: 1000 },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Review = mongoose.model('Review', reviewSchema);
