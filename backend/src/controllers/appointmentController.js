import { nanoid } from 'nanoid';
import { Slot } from '../models/Slot.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { Appointment } from '../models/Appointment.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { notifyUser } from '../services/notificationService.js';

export const createAppointment = catchAsync(async (req, res) => {
  const { doctorId, slotId, mode, familyMemberId, intakeForm } = req.validated.body;

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw ApiError.notFound('Doctor not found');
  if (!doctor.consultationModes.includes(mode)) {
    throw ApiError.badRequest(`This doctor does not offer ${mode} consultations`);
  }

  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) throw ApiError.notFound('Patient profile not found');

  // Atomic claim — prevents two patients from double-booking the same slot under load.
  const slot = await Slot.findOneAndUpdate(
    { _id: slotId, doctor: doctorId, status: 'available' },
    { status: 'booked' },
    { new: true }
  );
  if (!slot) throw ApiError.conflict('This slot is no longer available — please pick another');

  const fee = doctor.fee[mode] ?? 0;
  const roomId = mode === 'in_clinic' ? null : `room_${nanoid(12)}`;

  let appointment;
  try {
    appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      slot: slot._id,
      familyMemberId: familyMemberId || null,
      mode,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      intakeForm,
      fee,
      status: fee > 0 ? 'pending_payment' : 'confirmed',
      roomId,
    });
  } catch (err) {
    // Roll back the slot claim if appointment creation fails for any reason.
    await Slot.findByIdAndUpdate(slot._id, { status: 'available' });
    throw err;
  }

  await notifyUser(doctor.user, {
    title: 'New appointment request',
    body: `A patient booked a ${mode} consultation on ${slot.date} at ${slot.startTime}`,
    type: 'appointment',
    data: { appointmentId: appointment._id },
  });

  res.status(201).json({ success: true, message: 'Appointment created', data: { appointment } });
});

async function resolveViewerScope(req) {
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    return { patient: patient?._id };
  }
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    return { doctor: doctor?._id };
  }
  return {};
}

export const listMyAppointments = catchAsync(async (req, res) => {
  const { status, page, limit } = req.validated.query;
  const scope = await resolveViewerScope(req);
  const filter = { ...scope };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatarUrl' } })
      .populate({ path: 'patient', populate: { path: 'user', select: 'name avatarUrl' } })
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { appointments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
});

export const getAppointmentById = catchAsync(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatarUrl' } })
    .populate({ path: 'patient', populate: { path: 'user', select: 'name avatarUrl' } })
    .populate('prescription');
  if (!appointment) throw ApiError.notFound('Appointment not found');
  res.json({ success: true, data: { appointment } });
});

export const cancelAppointment = catchAsync(async (req, res) => {
  const { reason } = req.validated.body;
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw ApiError.notFound('Appointment not found');
  if (['completed', 'cancelled'].includes(appointment.status)) {
    throw ApiError.conflict(`Cannot cancel an appointment that is already ${appointment.status}`);
  }

  appointment.status = 'cancelled';
  appointment.cancelledBy = req.user.role;
  appointment.cancellationReason = reason || '';
  await appointment.save();
  await Slot.findByIdAndUpdate(appointment.slot, { status: 'available' });

  res.json({ success: true, message: 'Appointment cancelled', data: { appointment } });
});

// Patient enters the virtual waiting room ahead of their consultation.
export const enterWaitingRoom = catchAsync(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw ApiError.notFound('Appointment not found');
  if (appointment.status !== 'confirmed') {
    throw ApiError.conflict('Appointment must be confirmed before entering the waiting room');
  }
  appointment.status = 'waiting_room';
  await appointment.save();
  res.json({ success: true, data: { appointment } });
});
