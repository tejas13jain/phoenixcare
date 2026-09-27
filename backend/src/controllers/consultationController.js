import { Appointment } from '../models/Appointment.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { Patient } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

async function assertParticipant(req, appointment) {
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient || patient._id.toString() !== appointment.patient.toString()) {
      throw ApiError.forbidden('Not a participant in this consultation');
    }
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || doctor._id.toString() !== appointment.doctor.toString()) {
      throw ApiError.forbidden('Not a participant in this consultation');
    }
  }
}

// Public STUN servers are enough for most peer-to-peer connections during local development/demo.
// For production-grade NAT traversal at scale, add a TURN server (Twilio NTS / Agora / coturn)
// here and the client picks it up automatically — no other code changes required.
const DEFAULT_ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];

export const getRoomInfo = catchAsync(async (req, res) => {
  const appointment = await Appointment.findById(req.params.appointmentId);
  if (!appointment) throw ApiError.notFound('Appointment not found');
  if (!appointment.roomId) throw ApiError.badRequest('This appointment mode does not use a video/audio/chat room');
  if (!['confirmed', 'waiting_room', 'in_progress'].includes(appointment.status)) {
    throw ApiError.conflict(`Consultation is not currently joinable (status: ${appointment.status})`);
  }

  await assertParticipant(req, appointment);

  res.json({
    success: true,
    data: {
      roomId: appointment.roomId,
      mode: appointment.mode,
      iceServers: DEFAULT_ICE_SERVERS,
      appointment,
    },
  });
});

export const getChatHistory = catchAsync(async (req, res) => {
  const appointment = await Appointment.findById(req.params.appointmentId);
  if (!appointment) throw ApiError.notFound('Appointment not found');
  await assertParticipant(req, appointment);

  const messages = await ChatMessage.find({ appointment: appointment._id }).sort({ createdAt: 1 });
  res.json({ success: true, data: { messages } });
});
