import { Doctor } from '../models/Doctor.js';
import { Review } from '../models/Review.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

const SORT_MAP = {
  rating: { rating: -1 },
  fee_low: { 'fee.video': 1 },
  fee_high: { 'fee.video': -1 },
  experience: { experienceYears: -1 },
};

export const listDoctors = catchAsync(async (req, res) => {
  const { q, specialty, city, language, mode, minFee, maxFee, minRating, sort, page, limit } = req.validated.query;

  const filter = { kycStatus: 'verified', isAcceptingNewPatients: true };
  if (specialty) filter.specialties = { $regex: specialty, $options: 'i' };
  if (city) filter.city = { $regex: `^${city}$`, $options: 'i' };
  if (language) filter.languages = { $regex: language, $options: 'i' };
  if (mode) filter.consultationModes = mode;
  if (minRating) filter.rating = { $gte: minRating };
  if (minFee !== undefined || maxFee !== undefined) {
    filter['fee.video'] = {};
    if (minFee !== undefined) filter['fee.video'].$gte = minFee;
    if (maxFee !== undefined) filter['fee.video'].$lte = maxFee;
  }
  if (q) {
    filter.$or = [
      { specialties: { $regex: q, $options: 'i' } },
      { bio: { $regex: q, $options: 'i' } },
      { qualifications: { $regex: q, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const sortBy = SORT_MAP[sort] || { isFeatured: -1, rating: -1 };

  const [doctors, total] = await Promise.all([
    Doctor.find(filter)
      .populate('user', 'name avatarUrl')
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .lean(),
    Doctor.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      doctors,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});

export const getFeaturedDoctors = catchAsync(async (req, res) => {
  const doctors = await Doctor.find({ kycStatus: 'verified', isFeatured: true })
    .populate('user', 'name avatarUrl')
    .sort({ rating: -1 })
    .limit(10)
    .lean();
  res.json({ success: true, data: { doctors } });
});

export const getDoctorSpecialties = catchAsync(async (req, res) => {
  const specialties = await Doctor.distinct('specialties', { kycStatus: 'verified' });
  res.json({ success: true, data: { specialties: specialties.sort() } });
});

export const getDoctorById = catchAsync(async (req, res) => {
  const doctor = await Doctor.findById(req.validated.params.id).populate('user', 'name avatarUrl').lean();
  if (!doctor) throw ApiError.notFound('Doctor not found');

  const reviews = await Review.find({ doctor: doctor._id, isHidden: false })
    .populate({ path: 'patient', populate: { path: 'user', select: 'name avatarUrl' } })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.json({ success: true, data: { doctor, reviews } });
});

export const updateMyDoctorProfile = catchAsync(async (req, res) => {
  const doctor = await Doctor.findOneAndUpdate({ user: req.user._id }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doctor) throw ApiError.notFound('Doctor profile not found');
  res.json({ success: true, message: 'Profile updated', data: { doctor } });
});

export const getMyDoctorProfile = catchAsync(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id }).populate('user', 'name email phone avatarUrl');
  if (!doctor) throw ApiError.notFound('Doctor profile not found');
  res.json({ success: true, data: { doctor } });
});
