import { Doctor } from '../models/Doctor.js';
import { Review } from '../models/Review.js';
import { Appointment } from '../models/Appointment.js';
import { Payment } from '../models/Payment.js';
import { Patient } from '../models/Patient.js';
import { matchSpecialtiesFromKeywords } from '../constants/specialtyKeywords.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { buildWorkbook, sendWorkbook } from '../services/excelService.js';

const SORT_MAP = {
  rating: { rating: -1 },
  fee_low: { 'fee.video': 1 },
  fee_high: { 'fee.video': -1 },
  experience: { experienceYears: -1 },
};

export const listDoctors = catchAsync(async (req, res) => {
  const { q, specialty, city, language, mode, minFee, maxFee, minRating, minExperience, sort, page, limit } =
    req.validated.query;

  const filter = { kycStatus: 'verified', isAcceptingNewPatients: true };
  if (specialty) filter.specialties = { $regex: specialty, $options: 'i' };
  if (city) filter.city = { $regex: `^${city}$`, $options: 'i' };
  if (language) filter.languages = { $regex: language, $options: 'i' };
  if (mode) filter.consultationModes = mode;
  if (minRating) filter.rating = { $gte: minRating };
  if (minExperience) filter.experienceYears = { $gte: minExperience };
  if (minFee !== undefined || maxFee !== undefined) {
    filter['fee.video'] = {};
    if (minFee !== undefined) filter['fee.video'].$gte = minFee;
    if (maxFee !== undefined) filter['fee.video'].$lte = maxFee;
  }
  if (q) {
    // A patient searching "chest pain" or "skin rash" doesn't know that's a Cardiologist or
    // Dermatologist — expand the free-text query with any specialty their symptom maps to.
    const keywordSpecialties = matchSpecialtiesFromKeywords(q);
    filter.$or = [
      { specialties: { $regex: q, $options: 'i' } },
      { bio: { $regex: q, $options: 'i' } },
      { qualifications: { $regex: q, $options: 'i' } },
      ...(keywordSpecialties.length ? [{ specialties: { $in: keywordSpecialties } }] : []),
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

export const getDoctorCities = catchAsync(async (req, res) => {
  const cities = await Doctor.distinct('city', { kycStatus: 'verified', city: { $nin: [null, ''] } });
  res.json({ success: true, data: { cities: cities.sort() } });
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

export const getMyPatients = catchAsync(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw ApiError.notFound('Doctor profile not found');

  const patientIds = await Appointment.distinct('patient', {
    doctor: doctor._id,
    status: { $in: ['confirmed', 'waiting_room', 'in_progress', 'completed'] },
  });

  const patients = await Patient.find({ _id: { $in: patientIds } })
    .populate('user', 'name avatarUrl phone')
    .sort({ 'user.name': 1 })
    .lean();

  res.json({ success: true, data: { patients } });
});

// ---- Doctor analytics & reports ----

async function getOwnDoctorOrThrow(req) {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw ApiError.notFound('Doctor profile not found');
  return doctor;
}

export const getMyAnalytics = catchAsync(async (req, res) => {
  const doctor = await getOwnDoctorOrThrow(req);
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [consultationsPerDay, earningsAgg, modeBreakdown, statusFunnel] = await Promise.all([
    Appointment.aggregate([
      { $match: { doctor: doctor._id, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Payment.aggregate([
      { $lookup: { from: 'appointments', localField: 'appointment', foreignField: '_id', as: 'appt' } },
      { $unwind: '$appt' },
      { $match: { 'appt.doctor': doctor._id, status: 'paid' } },
      { $group: { _id: null, totalEarnings: { $sum: '$doctorPayoutAmount' }, totalCollected: { $sum: '$amount' } } },
    ]),
    Appointment.aggregate([
      { $match: { doctor: doctor._id } },
      { $group: { _id: '$mode', count: { $sum: 1 } } },
    ]),
    Appointment.aggregate([
      { $match: { doctor: doctor._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      consultationsPerDay,
      earnings: earningsAgg[0] || { totalEarnings: 0, totalCollected: 0 },
      modeBreakdown,
      statusFunnel,
      rating: doctor.rating,
      ratingCount: doctor.ratingCount,
      totalConsultations: doctor.totalConsultations,
    },
  });
});

const DOCTOR_APPOINTMENT_COLUMNS = [
  { header: 'Date', key: 'date', width: 12 },
  { header: 'Time', key: 'time', width: 10 },
  { header: 'Patient', key: 'patient', width: 22 },
  { header: 'Mode', key: 'mode', width: 12 },
  { header: 'Status', key: 'status', width: 16 },
  { header: 'Fee (INR)', key: 'fee', width: 12 },
];

const DOCTOR_EARNINGS_COLUMNS = [
  { header: 'Date', key: 'date', width: 14 },
  { header: 'Patient', key: 'patient', width: 22 },
  { header: 'Amount (INR)', key: 'amount', width: 14 },
  { header: 'Commission (INR)', key: 'commission', width: 16 },
  { header: 'Your Payout (INR)', key: 'payout', width: 16 },
  { header: 'Payment Status', key: 'status', width: 16 },
  { header: 'Payout Status', key: 'payoutStatus', width: 16 },
];

export const exportMyReport = catchAsync(async (req, res) => {
  const doctor = await getOwnDoctorOrThrow(req);

  const appointments = await Appointment.find({ doctor: doctor._id })
    .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
    .sort({ date: -1, startTime: -1 });

  const appointmentIds = appointments.map((a) => a._id);
  const paymentsForDoctor = await Payment.find({ appointment: { $in: appointmentIds } })
    .populate({ path: 'appointment', populate: { path: 'patient', populate: { path: 'user', select: 'name' } } })
    .sort({ createdAt: -1 });

  const appointmentRows = appointments.map((a) => ({
    date: a.date,
    time: a.startTime,
    patient: a.patient?.user?.name || '—',
    mode: a.mode,
    status: a.status.replace('_', ' '),
    fee: a.fee,
  }));

  const earningsRows = paymentsForDoctor.map((p) => ({
    date: p.createdAt.toLocaleDateString('en-IN'),
    patient: p.appointment?.patient?.user?.name || '—',
    amount: p.amount,
    commission: p.commissionAmount,
    payout: p.doctorPayoutAmount,
    status: p.status,
    payoutStatus: p.payoutStatus,
  }));

  const workbook = buildWorkbook([
    {
      name: 'Appointments',
      title: `${doctor.registrationNumber} — Appointment History`,
      subtitle: 'All time',
      columns: DOCTOR_APPOINTMENT_COLUMNS,
      rows: appointmentRows,
    },
    {
      name: 'Earnings',
      title: 'Earnings & Payouts',
      subtitle: 'All time',
      columns: DOCTOR_EARNINGS_COLUMNS,
      rows: earningsRows,
    },
  ]);

  await sendWorkbook(res, workbook, `phoenixcare-my-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
});
