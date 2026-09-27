import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Appointment } from '../models/Appointment.js';
import { Prescription } from '../models/Prescription.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { generatePrescriptionPdfBuffer } from '../services/pdfService.js';
import { notifyUser } from '../services/notificationService.js';
import { cloudinary } from '../config/cloudinary.js';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'prescriptions');

async function persistPdf(buffer, filename) {
  if (env.cloudinary.cloudName) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'phoenixcare/prescriptions', public_id: filename, resource_type: 'raw' },
        (err, result) => (err ? reject(err) : resolve(result.secure_url))
      );
      stream.end(buffer);
    });
  }

  fs.mkdirSync(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, `${filename}.pdf`);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/prescriptions/${filename}.pdf`;
}

export const createPrescription = catchAsync(async (req, res) => {
  const { appointmentId, diagnosis, medicines, labTestsAdvised, advice, followUpDate } = req.validated.body;

  const appointment = await Appointment.findById(appointmentId)
    .populate({ path: 'doctor', populate: 'user' })
    .populate({ path: 'patient', populate: 'user' });
  if (!appointment) throw ApiError.notFound('Appointment not found');

  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor || doctor._id.toString() !== appointment.doctor._id.toString()) {
    throw ApiError.forbidden('Only the consulting doctor can write this prescription');
  }
  if (appointment.prescription) throw ApiError.conflict('A prescription already exists for this appointment');

  const prescriptionData = { diagnosis, medicines, labTestsAdvised, advice, followUpDate };
  const pdfBuffer = await generatePrescriptionPdfBuffer({
    doctor: appointment.doctor.user,
    patient: appointment.patient.user,
    prescription: prescriptionData,
    appointment,
  });
  const pdfUrl = await persistPdf(pdfBuffer, `rx_${appointment._id}`);

  const prescription = await Prescription.create({
    appointment: appointment._id,
    doctor: doctor._id,
    patient: appointment.patient._id,
    ...prescriptionData,
    pdfUrl,
  });

  appointment.prescription = prescription._id;
  appointment.status = 'completed';
  appointment.completedAt = new Date();
  await appointment.save();

  doctor.totalConsultations += 1;
  await doctor.save();

  await notifyUser(appointment.patient.user._id, {
    title: 'Your prescription is ready',
    body: `Dr. ${appointment.doctor.user.name} has shared your digital prescription`,
    type: 'prescription',
    data: { prescriptionId: prescription._id },
  });

  res.status(201).json({ success: true, message: 'Prescription created', data: { prescription } });
});

export const getPrescriptionByAppointment = catchAsync(async (req, res) => {
  const prescription = await Prescription.findOne({ appointment: req.params.appointmentId });
  if (!prescription) throw ApiError.notFound('No prescription found for this appointment');

  if (req.user.role !== 'admin') {
    const patient = await Patient.findOne({ user: req.user._id });
    const doctor = await Doctor.findOne({ user: req.user._id });
    const isOwner =
      (patient && patient._id.toString() === prescription.patient.toString()) ||
      (doctor && doctor._id.toString() === prescription.doctor.toString());
    if (!isOwner) throw ApiError.forbidden('You do not have access to this prescription');
  }

  res.json({ success: true, data: { prescription } });
});
