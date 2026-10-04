import { phoneVariants } from '../utils/phone.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Doctor } from '../models/Doctor.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { sendEmail } from '../services/emailService.js';
import { sendStandardsEmail, sendStandardsEmailOnce } from '../services/doctorComplianceService.js';
import { assertCanVerify } from '../services/kycDocumentService.js';
import { KYC_DOCUMENT_TYPES } from '../constants/kycDocuments.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

// Readable one-time password that also satisfies the signup password rules
// (8+ chars, an uppercase letter and a number).
function generateTempPassword() {
  return `Pc${crypto.randomBytes(6).toString('base64url')}7`;
}

// "Deep search" across the doctor's account (name, email, phone) and profile
// (registration number, specialties, qualifications, city, clinic address).
export const searchDoctors = catchAsync(async (req, res) => {
  const { q, specialty, city, kycStatus, page, limit } = req.validated.query;
  const filter = {};
  if (specialty) filter.specialties = specialty;
  if (city) filter.city = { $regex: `^${escapeRegex(city)}$`, $options: 'i' };
  if (kycStatus) filter.kycStatus = kycStatus;

  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    const userIds = await User.find({ role: 'doctor', $or: [{ name: rx }, { email: rx }, { phone: rx }] }).distinct('_id');
    filter.$or = [
      { user: { $in: userIds } },
      { registrationNumber: rx },
      { specialties: rx },
      { qualifications: rx },
      { city: rx },
      { clinicAddress: rx },
    ];
  }

  const [doctors, total] = await Promise.all([
    Doctor.find(filter, '-payoutDetails')
      .populate('user', 'name email phone isActive lastLoginAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Doctor.countDocuments(filter),
  ]);

  res.json({ success: true, data: { doctors, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
});

export const createDoctor = catchAsync(async (req, res) => {
  const { name, email, phone, kycStatus, ...profile } = req.validated.body;

  // A doctor can only go live after uploading verification documents that an admin has approved,
  // so new doctors always start as pending.
  if (kycStatus === 'verified') {
    throw ApiError.badRequest('A doctor can be verified only after they upload their documents and you approve them. Create them as Pending.');
  }

  if (await User.exists({ $or: [{ email }, { phone: { $in: phoneVariants(phone) } }] })) {
    throw ApiError.conflict('An account with this email or phone already exists');
  }
  if (await Doctor.exists({ registrationNumber: profile.registrationNumber })) {
    throw ApiError.conflict('A doctor with this registration number is already onboarded');
  }

  const tempPassword = generateTempPassword();
  const user = await User.create({
    name,
    email,
    phone,
    role: 'doctor',
    passwordHash: await bcrypt.hash(tempPassword, 12),
  });

  let doctor;
  try {
    doctor = await Doctor.create({ ...profile, user: user._id, kycStatus: kycStatus || 'pending' });
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    throw err;
  }

  let emailSent = false;
  try {
    const result = await sendEmail({
      to: email,
      subject: 'Welcome to PhoenixCare — your doctor account is ready',
      title: `Welcome, Dr. ${name.replace(/^dr\.?\s*/i, '')}`,
      body: `Your PhoenixCare doctor account has been created by our team.<br/><br/>
        <strong>Email:</strong> ${email}<br/>
        <strong>Temporary password:</strong> <code style="font-size:16px;">${tempPassword}</code><br/><br/>
        You can also sign in any time with a one-time code sent to your email or phone.<br/><br/>
        The first time you sign in you will be asked to read and accept the PhoenixCare Doctor Terms &amp; Conditions —
        we are sending them to you in a separate email.<br/><br/>
        <strong>Next, upload your verification documents.</strong> You will not appear to patients until our team has checked them:<br/>
        ${KYC_DOCUMENT_TYPES.filter((d) => d.required).map((d) => `&bull; ${d.label}`).join('<br/>')}<br/>
        PDF, JPG or PNG, up to 4 MB each. After they are approved, set your availability so patients can start booking.`,
      ctaLabel: 'Sign in and upload documents',
      ctaUrl: `${env.clientUrl}/login`,
    });
    emailSent = !!result.sent;
  } catch (err) {
    logger.error(`Welcome email to ${email} failed: ${err.message}`);
  }

  // Separate email with every standard that applies to practising on an Indian online portal.
  const standardsEmailSent = !!(await sendStandardsEmailOnce(doctor, user)).sent;

  const populated = await doctor.populate('user', 'name email phone isActive');
  res.status(201).json({
    success: true,
    message: `Dr. ${name} onboarded`,
    // Returned once so the admin can share it if the welcome email couldn't be sent.
    data: { doctor: populated, tempPassword, emailSent, standardsEmailSent },
  });
});

export const updateDoctorByAdmin = catchAsync(async (req, res) => {
  const { id } = req.validated.params;
  const { name, ...profile } = req.validated.body;

  const doctor = await Doctor.findById(id);
  if (!doctor) throw ApiError.notFound('Doctor not found');

  if (
    profile.registrationNumber &&
    (await Doctor.exists({ registrationNumber: profile.registrationNumber, _id: { $ne: id } }))
  ) {
    throw ApiError.conflict('Another doctor already uses this registration number');
  }

  if (profile.kycStatus === 'verified' && doctor.kycStatus !== 'verified') assertCanVerify(doctor);

  if (name) await User.updateOne({ _id: doctor.user }, { name });
  if (profile.kycStatus && profile.kycStatus !== 'rejected') profile.kycRejectionReason = '';
  doctor.set(profile);
  await doctor.save();

  await doctor.populate('user', 'name email phone isActive');
  res.json({ success: true, message: 'Doctor updated', data: { doctor } });
});

export const resendStandardsEmail = catchAsync(async (req, res) => {
  const doctor = await Doctor.findById(req.validated.params.id).populate('user', 'name email');
  if (!doctor) throw ApiError.notFound('Doctor not found');

  const result = await sendStandardsEmail(doctor, doctor.user);
  if (!result.sent) {
    throw ApiError.badRequest('Email is not configured on the server, so the email could not be sent.');
  }
  res.json({ success: true, message: `Terms & standards emailed to ${doctor.user.email}` });
});
