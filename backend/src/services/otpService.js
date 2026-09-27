import bcrypt from 'bcryptjs';
import { OtpCode } from '../models/OtpCode.js';
import { env } from '../config/env.js';
import { sendSms, sendWhatsapp } from './notificationService.js';
import { logger } from '../config/logger.js';

function generateSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueOtp({ identifier, channel, purpose }) {
  const code = generateSixDigitCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + env.otpExpiresMinutes * 60 * 1000);

  await OtpCode.create({ identifier, channel, purpose, codeHash, expiresAt });

  const message = `${code} is your PhoenixCare verification code. Valid for ${env.otpExpiresMinutes} minutes. Do not share this with anyone.`;

  if (channel === 'sms') await sendSms(identifier, message);
  else if (channel === 'whatsapp') await sendWhatsapp(identifier, message);
  else logger.info(`[email OTP stub] Would email ${identifier}: ${message}`);

  // Never return the raw code from this function in production flows.
  return { expiresAt };
}

export async function verifyOtp({ identifier, code, purpose }) {
  const record = await OtpCode.findOne({ identifier, purpose, consumedAt: null }).sort({ createdAt: -1 });
  if (!record) return { valid: false, reason: 'No pending OTP for this identifier' };
  if (record.expiresAt < new Date()) return { valid: false, reason: 'OTP has expired' };
  if (record.attempts >= 5) return { valid: false, reason: 'Too many incorrect attempts' };

  const matches = await bcrypt.compare(code, record.codeHash);
  if (!matches) {
    record.attempts += 1;
    await record.save();
    return { valid: false, reason: 'Incorrect OTP' };
  }

  record.consumedAt = new Date();
  await record.save();
  return { valid: true };
}
