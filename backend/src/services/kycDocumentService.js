import { Doctor } from '../models/Doctor.js';
import { KycFile } from '../models/KycFile.js';
import { User } from '../models/User.js';
import { KYC_DOCUMENT_TYPES, REQUIRED_KYC_TYPES, getKycDocumentType } from '../constants/kycDocuments.js';
import { notifyUser } from './notificationService.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

export const DOCUMENTS_INCOMPLETE_CODE = 'DOCUMENTS_INCOMPLETE';

// Identify the real file type from its first bytes — never trust the browser-supplied type,
// since this is the only thing standing between an upload and a stored "document".
export function detectMimeType(buffer) {
  if (!buffer || buffer.length < 8) return null;
  if (buffer.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  return null;
}

// What the doctor's page and the admin review screen render: every document type, with the
// uploaded file's details (never the bytes) when there is one, plus overall progress.
export function summarizeDocuments(doctor) {
  const byType = new Map((doctor.kycDocuments || []).map((d) => [d.docType, d]));

  const requirements = KYC_DOCUMENT_TYPES.map((req) => {
    const doc = byType.get(req.type);
    return {
      ...req,
      document: doc
        ? {
            originalName: doc.originalName,
            mimeType: doc.mimeType,
            size: doc.size,
            status: doc.status,
            rejectionReason: doc.rejectionReason || '',
            uploadedAt: doc.uploadedAt,
            reviewedAt: doc.reviewedAt || null,
          }
        : null,
    };
  });

  const required = requirements.filter((r) => r.required);
  const uploaded = required.filter((r) => r.document);
  const approved = required.filter((r) => r.document?.status === 'approved');
  const rejected = required.filter((r) => r.document?.status === 'rejected');

  return {
    requirements,
    kycStatus: doctor.kycStatus,
    kycRejectionReason: doctor.kycRejectionReason || '',
    requiredTotal: required.length,
    requiredUploaded: uploaded.length,
    requiredApproved: approved.length,
    // Everything required is uploaded (waiting on, or past, admin review).
    complete: uploaded.length === required.length,
    allApproved: approved.length === required.length,
    // The doctor still has something to do: a missing or rejected required document.
    needsAction: uploaded.length < required.length || rejected.length > 0,
  };
}

// Throws unless every required document is uploaded and approved. Called whenever an admin
// tries to move a doctor to "verified".
export function assertCanVerify(doctor) {
  const summary = summarizeDocuments(doctor);
  if (summary.allApproved) return;

  const problems = summary.requirements
    .filter((r) => r.required && r.document?.status !== 'approved')
    .map((r) => `${r.label} (${r.document ? r.document.status : 'not uploaded'})`);
  throw new ApiError(
    400,
    `Can't verify yet — every required document must be uploaded and approved. Outstanding: ${problems.join(', ')}.`,
    undefined,
    DOCUMENTS_INCOMPLETE_CODE
  );
}

async function notifyAdmins(doctor, user) {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    await Promise.all(
      admins.map((a) =>
        notifyUser(a._id, {
          title: 'Doctor documents ready to review',
          body: `Dr. ${user.name} has uploaded all required verification documents. Open Admin → Doctors to review them.`,
          type: 'system',
        })
      )
    );
  } catch (err) {
    logger.error(`Could not notify admins about documents from ${user.email}: ${err.message}`);
  }
}

// Stores (or replaces) one document. Replacing resets it to "pending" and deletes the old file.
export async function saveDoctorDocument(doctor, user, docType, file) {
  const spec = getKycDocumentType(docType);
  if (!spec) throw ApiError.badRequest('Unknown document type');
  if (!file?.buffer?.length) throw ApiError.badRequest('Please choose a file to upload');

  const mimeType = detectMimeType(file.buffer);
  if (!mimeType) throw ApiError.badRequest('Please upload a PDF, JPG or PNG file.');
  if (spec.imagesOnly && mimeType === 'application/pdf') {
    throw ApiError.badRequest('This one needs a photo — please upload a JPG or PNG image.');
  }

  const stored = await KycFile.create({
    doctor: doctor._id,
    docType,
    mimeType,
    size: file.buffer.length,
    data: file.buffer,
  });

  const existing = doctor.kycDocuments.find((d) => d.docType === docType);
  if (existing?.file) await KycFile.deleteOne({ _id: existing.file });

  const entry = {
    docType,
    originalName: (file.originalname || '').slice(0, 120),
    mimeType,
    size: stored.size,
    file: stored._id,
    status: 'pending',
    rejectionReason: '',
    uploadedAt: new Date(),
    reviewedAt: undefined,
    reviewedBy: undefined,
  };
  if (existing) Object.assign(existing, entry);
  else doctor.kycDocuments.push(entry);

  // Once everything required is in, the doctor moves to "under review" for the admin team.
  const wasWaiting = ['pending', 'rejected'].includes(doctor.kycStatus);
  const summary = summarizeDocuments(doctor);
  const submittedForReview = wasWaiting && summary.complete && !summary.requirements.some((r) => r.required && r.document?.status === 'rejected');
  if (submittedForReview) {
    doctor.kycStatus = 'under_review';
    doctor.kycRejectionReason = '';
  }
  await doctor.save();

  if (submittedForReview) notifyAdmins(doctor, user);
  return { summary: summarizeDocuments(doctor), submittedForReview };
}

export const isRequiredType = (type) => REQUIRED_KYC_TYPES.includes(type);

export async function findDoctorByUser(userId) {
  const doctor = await Doctor.findOne({ user: userId });
  if (!doctor) throw ApiError.notFound('Doctor profile not found');
  return doctor;
}
