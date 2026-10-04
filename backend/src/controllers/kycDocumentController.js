import { Doctor } from '../models/Doctor.js';
import { KycFile } from '../models/KycFile.js';
import { getKycDocumentType } from '../constants/kycDocuments.js';
import { findDoctorByUser, saveDoctorDocument, summarizeDocuments } from '../services/kycDocumentService.js';
import { notifyUser } from '../services/notificationService.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

// Streams a stored document. Identity documents must never be cached, sniffed or rendered as
// a web page, so the response is locked down: private, no-store, nosniff and sandboxed.
async function sendDocument(res, doctor, docType) {
  const doc = doctor.kycDocuments.find((d) => d.docType === docType);
  if (!doc?.file) throw ApiError.notFound('Document not found');

  const file = await KycFile.findById(doc.file).select('+data');
  if (!file) throw ApiError.notFound('Document not found');

  const ext = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }[file.mimeType];
  res.set({
    'Content-Type': file.mimeType,
    'Content-Length': file.size,
    'Content-Disposition': `inline; filename="${docType}.${ext}"`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-store',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  });
  res.send(file.data);
}

// ---- Doctor (own documents) ----

export const getMyDocuments = catchAsync(async (req, res) => {
  const doctor = await findDoctorByUser(req.user._id);
  res.json({ success: true, data: summarizeDocuments(doctor) });
});

export const uploadMyDocument = catchAsync(async (req, res) => {
  const doctor = await findDoctorByUser(req.user._id);
  const { summary, submittedForReview } = await saveDoctorDocument(doctor, req.user, req.validated.params.docType, req.file);
  res.status(201).json({
    success: true,
    message: submittedForReview
      ? 'All documents received — our team will review them and let you know.'
      : 'Document uploaded.',
    data: summary,
  });
});

export const getMyDocumentFile = catchAsync(async (req, res) => {
  const doctor = await findDoctorByUser(req.user._id);
  await sendDocument(res, doctor, req.validated.params.docType);
});

// ---- Admin (review) ----

async function findDoctorForAdmin(id) {
  const doctor = await Doctor.findById(id).populate('user', 'name email');
  if (!doctor) throw ApiError.notFound('Doctor not found');
  return doctor;
}

export const getDoctorDocuments = catchAsync(async (req, res) => {
  const doctor = await findDoctorForAdmin(req.validated.params.id);
  res.json({
    success: true,
    data: { doctor: { _id: doctor._id, name: doctor.user?.name, registrationNumber: doctor.registrationNumber }, ...summarizeDocuments(doctor) },
  });
});

export const getDoctorDocumentFile = catchAsync(async (req, res) => {
  const doctor = await findDoctorForAdmin(req.validated.params.id);
  await sendDocument(res, doctor, req.validated.params.docType);
});

export const reviewDoctorDocument = catchAsync(async (req, res) => {
  const { id, docType } = req.validated.params;
  const { status, reason } = req.validated.body;

  const doctor = await findDoctorForAdmin(id);
  const doc = doctor.kycDocuments.find((d) => d.docType === docType);
  if (!doc) throw ApiError.notFound('This document has not been uploaded yet');

  doc.status = status;
  doc.rejectionReason = status === 'rejected' ? reason : '';
  doc.reviewedAt = new Date();
  doc.reviewedBy = req.user._id;

  // A rejected document sends the doctor back to "action needed", unless they're already live.
  if (status === 'rejected' && doctor.kycStatus !== 'verified') doctor.kycStatus = 'pending';
  await doctor.save();

  if (status === 'rejected') {
    const label = getKycDocumentType(docType)?.label || 'a document';
    await notifyUser(doctor.user._id, {
      title: 'Please re-upload a document',
      body: `Your ${label} could not be accepted: ${reason}. Please upload a corrected copy from Verification documents in your doctor dashboard.`,
      type: 'system',
      channels: ['in_app', 'email'],
      email: doctor.user.email,
      recipientName: doctor.user.name,
    });
  }

  res.json({ success: true, message: `Document ${status}`, data: summarizeDocuments(doctor) });
});
