import mongoose from 'mongoose';

const { Schema } = mongoose;

const otpCodeSchema = new Schema(
  {
    identifier: { type: String, required: true, index: true },
    channel: { type: String, enum: ['email', 'sms', 'whatsapp'], required: true },
    purpose: { type: String, enum: ['signup', 'login', 'reset_password'], required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export const OtpCode = mongoose.model('OtpCode', otpCodeSchema);
