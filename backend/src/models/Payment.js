import mongoose from 'mongoose';

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    appointment: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    commissionPct: { type: Number, default: 20 },
    commissionAmount: { type: Number },
    doctorPayoutAmount: { type: Number },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    method: { type: String },
    payoutStatus: { type: String, enum: ['pending', 'processing', 'paid'], default: 'pending' },
    refundReason: { type: String },
  },
  { timestamps: true }
);

paymentSchema.pre('save', function computeSplits(next) {
  if (this.isModified('amount') || this.isModified('commissionPct')) {
    this.commissionAmount = Math.round((this.amount * this.commissionPct) / 100);
    this.doctorPayoutAmount = this.amount - this.commissionAmount;
  }
  next();
});

export const Payment = mongoose.model('Payment', paymentSchema);
