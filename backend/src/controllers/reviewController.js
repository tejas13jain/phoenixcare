import { Appointment } from '../models/Appointment.js';
import { Review } from '../models/Review.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

async function recalculateDoctorRating(doctorId) {
  const stats = await Review.aggregate([
    { $match: { doctor: doctorId, isHidden: false } },
    { $group: { _id: '$doctor', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avgRating = 0, count = 0 } = stats[0] || {};
  await Doctor.findByIdAndUpdate(doctorId, { rating: Math.round(avgRating * 10) / 10, ratingCount: count });
}

export const createReview = catchAsync(async (req, res) => {
  const { appointmentId, rating, comment } = req.body;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw ApiError.notFound('Appointment not found');
  if (appointment.status !== 'completed') throw ApiError.conflict('You can only review completed consultations');

  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient || patient._id.toString() !== appointment.patient.toString()) {
    throw ApiError.forbidden('This appointment does not belong to you');
  }

  const review = await Review.create({
    doctor: appointment.doctor,
    patient: patient._id,
    appointment: appointment._id,
    rating,
    comment,
  });

  await recalculateDoctorRating(appointment.doctor);

  res.status(201).json({ success: true, message: 'Review submitted', data: { review } });
});

export const listDoctorReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ doctor: req.params.doctorId, isHidden: false })
    .populate({ path: 'patient', populate: { path: 'user', select: 'name avatarUrl' } })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { reviews } });
});
