import { Doctor } from '../models/Doctor.js';
import { User } from '../models/User.js';
import { Appointment } from '../models/Appointment.js';
import { Payment } from '../models/Payment.js';
import { Review } from '../models/Review.js';
import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { notifyUser } from '../services/notificationService.js';

// ---- Doctor KYC onboarding ----

export const listPendingDoctors = catchAsync(async (req, res) => {
  const doctors = await Doctor.find({ kycStatus: { $in: ['pending', 'under_review'] } })
    .populate('user', 'name email phone')
    .sort({ createdAt: 1 });
  res.json({ success: true, data: { doctors } });
});

export const reviewDoctorKyc = catchAsync(async (req, res) => {
  const { status, reason } = req.body; // status: 'verified' | 'rejected' | 'under_review'
  if (!['verified', 'rejected', 'under_review'].includes(status)) {
    throw ApiError.badRequest('Invalid KYC status');
  }

  const doctor = await Doctor.findById(req.params.id).populate('user', 'name email');
  if (!doctor) throw ApiError.notFound('Doctor not found');

  doctor.kycStatus = status;
  doctor.kycRejectionReason = status === 'rejected' ? reason || '' : '';
  await doctor.save();

  await notifyUser(doctor.user._id, {
    title: `KYC ${status}`,
    body:
      status === 'verified'
        ? 'Your credentials have been verified. You can now start accepting patients.'
        : status === 'rejected'
        ? `Your KYC was rejected: ${reason || 'please resubmit documents'}`
        : 'Your KYC is under review.',
    type: 'system',
    channels: ['in_app', 'email', 'push'],
    email: doctor.user.email,
    recipientName: doctor.user.name,
  });

  res.json({ success: true, message: 'KYC status updated', data: { doctor } });
});

// ---- User management ----

export const listUsers = catchAsync(async (req, res) => {
  const { role, isActive, q, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }];

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: { users, pagination: { page: Number(page), limit: Number(limit), total } } });
});

export const setUserActiveStatus = catchAsync(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}`, data: { user: user.toSafeJSON() } });
});

// ---- Analytics dashboard ----

export const getAnalyticsOverview = catchAsync(async (req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [consultationsPerDay, revenueAgg, topDoctors, statusFunnel, totals] = await Promise.all([
    Appointment.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: since } } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' }, totalCommission: { $sum: '$commissionAmount' } } },
    ]),
    Appointment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$doctor', consultations: { $sum: 1 } } },
      { $sort: { consultations: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doctor' } },
      { $unwind: '$doctor' },
      { $lookup: { from: 'users', localField: 'doctor.user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { consultations: 1, name: '$user.name', rating: '$doctor.rating' } },
    ]),
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor' }),
      Doctor.countDocuments({ kycStatus: 'verified' }),
    ]),
  ]);

  const [totalPatients, totalDoctorAccounts, verifiedDoctors] = totals;

  res.json({
    success: true,
    data: {
      consultationsPerDay,
      revenue: revenueAgg[0] || { totalRevenue: 0, totalCommission: 0 },
      topDoctors,
      statusFunnel,
      totals: { totalPatients, totalDoctorAccounts, verifiedDoctors },
    },
  });
});

// ---- Commission & payouts ----

export const listPayments = catchAsync(async (req, res) => {
  const { status, payoutStatus, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (payoutStatus) filter.payoutStatus = payoutStatus;

  const skip = (Number(page) - 1) * Number(limit);
  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate({ path: 'appointment', populate: { path: 'doctor', populate: { path: 'user', select: 'name' } } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  res.json({ success: true, data: { payments, pagination: { page: Number(page), limit: Number(limit), total } } });
});

export const updatePayoutStatus = catchAsync(async (req, res) => {
  const { payoutStatus } = req.body;
  if (!['pending', 'processing', 'paid'].includes(payoutStatus)) throw ApiError.badRequest('Invalid payout status');

  const payment = await Payment.findByIdAndUpdate(req.params.id, { payoutStatus }, { new: true });
  if (!payment) throw ApiError.notFound('Payment not found');
  res.json({ success: true, message: 'Payout status updated', data: { payment } });
});

// ---- Content moderation ----

export const listFlaggedReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ $or: [{ isFlagged: true }, { rating: { $lte: 2 } }] })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
    .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { reviews } });
});

export const moderateReview = catchAsync(async (req, res) => {
  const { isHidden } = req.body;
  const review = await Review.findByIdAndUpdate(req.params.id, { isHidden }, { new: true });
  if (!review) throw ApiError.notFound('Review not found');
  res.json({ success: true, message: 'Review moderated', data: { review } });
});

// ---- Notification / campaign manager ----

export const sendCampaign = catchAsync(async (req, res) => {
  const { title, body, segment } = req.body; // segment: 'patients' | 'doctors' | 'all'
  const roleFilter = segment === 'all' ? {} : { role: segment === 'patients' ? 'patient' : 'doctor' };
  const users = await User.find(roleFilter).select('_id');

  await Notification.insertMany(
    users.map((u) => ({ user: u._id, title, body, type: 'promotion' }))
  );

  res.json({ success: true, message: `Campaign sent to ${users.length} users` });
});
