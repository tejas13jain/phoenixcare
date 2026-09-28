import { DietPlan } from '../models/DietPlan.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { Appointment } from '../models/Appointment.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { notifyUser } from '../services/notificationService.js';

async function getOwnDoctorOrThrow(req) {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw ApiError.notFound('Doctor profile not found');
  return doctor;
}

async function assertHasTreatedPatient(doctorId, patientId) {
  const hasHistory = await Appointment.exists({
    doctor: doctorId,
    patient: patientId,
    status: { $in: ['confirmed', 'waiting_room', 'in_progress', 'completed'] },
  });
  if (!hasHistory) {
    throw ApiError.forbidden('You can only create a diet plan for a patient you have an appointment with');
  }
}

export const createDietPlan = catchAsync(async (req, res) => {
  const doctor = await getOwnDoctorOrThrow(req);
  const { patientId, appointmentId, ...rest } = req.validated.body;

  const patient = await Patient.findById(patientId).populate('user', 'name email');
  if (!patient) throw ApiError.notFound('Patient not found');

  await assertHasTreatedPatient(doctor._id, patientId);

  const dietPlan = await DietPlan.create({
    doctor: doctor._id,
    patient: patientId,
    appointment: appointmentId,
    ...rest,
  });

  await notifyUser(patient.user._id, {
    title: 'Your doctor added a new diet plan',
    body: `Dr. ${req.user.name.replace(/^Dr\.?\s*/i, '')} shared a "${dietPlan.title}" diet plan for you. Open PhoenixCare to view your meals.`,
    type: 'diet_plan',
    data: { dietPlanId: dietPlan._id },
    channels: ['in_app', 'email', 'push'],
    email: patient.user.email,
    recipientName: patient.user.name,
    url: '/patient/diet-plans',
  });

  res.status(201).json({ success: true, message: 'Diet plan created and shared with the patient', data: { dietPlan } });
});

export const updateDietPlan = catchAsync(async (req, res) => {
  const doctor = await getOwnDoctorOrThrow(req);
  const dietPlan = await DietPlan.findOne({ _id: req.validated.params.id, doctor: doctor._id });
  if (!dietPlan) throw ApiError.notFound('Diet plan not found');

  Object.assign(dietPlan, req.validated.body);
  await dietPlan.save();

  res.json({ success: true, message: 'Diet plan updated', data: { dietPlan } });
});

export const deleteDietPlan = catchAsync(async (req, res) => {
  const doctor = await getOwnDoctorOrThrow(req);
  const dietPlan = await DietPlan.findOneAndDelete({ _id: req.validated.params.id, doctor: doctor._id });
  if (!dietPlan) throw ApiError.notFound('Diet plan not found');
  res.json({ success: true, message: 'Diet plan deleted' });
});

export const listMyDietPlansAsDoctor = catchAsync(async (req, res) => {
  const doctor = await getOwnDoctorOrThrow(req);
  const filter = { doctor: doctor._id };
  if (req.query.patientId) filter.patient = req.query.patientId;

  const dietPlans = await DietPlan.find(filter)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name avatarUrl' } })
    .sort({ createdAt: -1 });

  res.json({ success: true, data: { dietPlans } });
});

export const listMyDietPlansAsPatient = catchAsync(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) throw ApiError.notFound('Patient profile not found');

  const dietPlans = await DietPlan.find({ patient: patient._id })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatarUrl' } })
    .sort({ isActive: -1, createdAt: -1 });

  res.json({ success: true, data: { dietPlans } });
});

export const getDietPlanById = catchAsync(async (req, res) => {
  const dietPlan = await DietPlan.findById(req.validated.params.id)
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatarUrl' } })
    .populate({ path: 'patient', populate: { path: 'user', select: 'name avatarUrl' } });
  if (!dietPlan) throw ApiError.notFound('Diet plan not found');

  const isOwningDoctor = req.user.role === 'doctor' && dietPlan.doctor.user._id.toString() === req.user._id.toString();
  const isOwningPatient = req.user.role === 'patient' && dietPlan.patient.user._id.toString() === req.user._id.toString();
  if (!isOwningDoctor && !isOwningPatient && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have access to this diet plan');
  }

  res.json({ success: true, data: { dietPlan } });
});
