import { Doctor } from '../models/Doctor.js';
import { getTermsContent, TERMS_DECLARATIONS, TERMS_VERSION } from '../constants/doctorTerms.js';
import { sendAcceptanceReceipt } from '../services/doctorComplianceService.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

const statusOf = (doctor) => ({
  accepted: doctor?.termsAcceptance?.version === TERMS_VERSION,
  acceptedVersion: doctor?.termsAcceptance?.version || null,
  acceptedAt: doctor?.termsAcceptance?.acceptedAt || null,
  currentVersion: TERMS_VERSION,
});

// The terms text plus whether this doctor has accepted the current version.
export const getMyTerms = catchAsync(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id }).select('termsAcceptance').lean();
  if (!doctor) throw ApiError.notFound('Doctor profile not found');
  res.json({ success: true, data: { terms: getTermsContent(), status: statusOf(doctor) } });
});

export const acceptMyTerms = catchAsync(async (req, res) => {
  const { version, declarations } = req.validated.body;

  if (version !== TERMS_VERSION) {
    throw ApiError.conflict('These terms have just been updated. Please reload the page and read the latest version.');
  }
  const missing = TERMS_DECLARATIONS.filter((d) => !declarations.includes(d.id));
  if (missing.length) throw ApiError.badRequest('Please tick every declaration to continue');

  const acceptedAt = new Date();
  const doctor = await Doctor.findOneAndUpdate(
    { user: req.user._id },
    {
      termsAcceptance: {
        version,
        acceptedAt,
        ip: req.ip,
        userAgent: (req.headers['user-agent'] || '').slice(0, 300),
      },
    },
    { new: true }
  ).select('termsAcceptance');
  if (!doctor) throw ApiError.notFound('Doctor profile not found');

  sendAcceptanceReceipt(req.user, { version, acceptedAt });
  res.json({ success: true, message: 'Thank you — you can now start taking consultations.', data: { status: statusOf(doctor) } });
});
