// Mirrors backend/src/constants/kycDocuments.js. The API sends the full wording to the doctor's
// page; the admin lists only need the required types, to show "documents uploaded" progress.
export const REQUIRED_KYC_TYPES = ['registration_certificate', 'degree_certificate', 'government_id', 'profile_photo'];

// Summarises a doctor's uploaded documents (from the admin doctor list) for a small badge.
export function documentProgress(kycDocuments = []) {
  const byType = new Map(kycDocuments.map((d) => [d.docType, d]));
  const uploaded = REQUIRED_KYC_TYPES.filter((t) => byType.has(t)).length;
  const approved = REQUIRED_KYC_TYPES.filter((t) => byType.get(t)?.status === 'approved').length;
  const rejected = REQUIRED_KYC_TYPES.filter((t) => byType.get(t)?.status === 'rejected').length;
  return { uploaded, approved, rejected, total: REQUIRED_KYC_TYPES.length };
}

export const formatFileSize = (bytes = 0) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
