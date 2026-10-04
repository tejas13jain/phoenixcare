import { Doctor } from '../models/Doctor.js';
import { TERMS_VERSION } from '../constants/doctorTerms.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

export const TERMS_REQUIRED_CODE = 'TERMS_REQUIRED';

// A doctor can't practise (open slots, start consultations, prescribe, publish) until they
// have accepted the current Doctor Terms & Conditions. Applies only to doctors, so admins and
// patients sharing a route pass straight through. Must run after requireAuth.
export const requireDoctorTerms = catchAsync(async (req, res, next) => {
  if (req.user?.role !== 'doctor') return next();

  const doctor = await Doctor.findOne({ user: req.user._id }).select('termsAcceptance.version').lean();
  if (doctor?.termsAcceptance?.version !== TERMS_VERSION) {
    throw ApiError.forbidden(
      'Please read and accept the PhoenixCare Doctor Terms & Conditions before you continue.',
      TERMS_REQUIRED_CODE
    );
  }
  next();
});
