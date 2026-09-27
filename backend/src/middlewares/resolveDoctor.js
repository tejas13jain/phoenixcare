import { Doctor } from '../models/Doctor.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

// Resolves the ":doctorId" route param, allowing "me" as shorthand for the
// authenticated doctor's own profile. Attaches the Doctor doc as req.targetDoctor.
export const resolveDoctorParam = catchAsync(async (req, res, next) => {
  const { doctorId } = req.params;

  if (doctorId === 'me') {
    if (!req.user || req.user.role !== 'doctor') throw ApiError.unauthorized('Doctor login required');
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) throw ApiError.notFound('Doctor profile not found');
    req.targetDoctor = doctor;
    req.params.doctorId = doctor._id.toString();
    return next();
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw ApiError.notFound('Doctor not found');
  req.targetDoctor = doctor;
  next();
});

// Blocks a doctor from managing another doctor's slots/appointments; admins pass through.
export const requireDoctorOwnership = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (req.user.role === 'doctor' && req.targetDoctor.user.toString() === req.user._id.toString()) {
    return next();
  }
  next(ApiError.forbidden('You can only manage your own profile'));
};
