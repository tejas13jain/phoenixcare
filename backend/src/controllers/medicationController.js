import { Medication } from '../models/Medication.js';
import { Patient } from '../models/Patient.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

async function getPatientOrThrow(req) {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) throw ApiError.notFound('Patient profile not found');
  return patient;
}

export const listMedications = catchAsync(async (req, res) => {
  const patient = await getPatientOrThrow(req);
  const medications = await Medication.find({ patient: patient._id, isActive: true }).sort({ createdAt: -1 });
  res.json({ success: true, data: { medications } });
});

export const createMedication = catchAsync(async (req, res) => {
  const { name, dosage, times, startDate, endDate, notes } = req.body;
  if (!name || !dosage || !Array.isArray(times) || times.length === 0) {
    throw ApiError.badRequest('name, dosage, and at least one reminder time are required');
  }
  const patient = await getPatientOrThrow(req);
  const medication = await Medication.create({
    patient: patient._id,
    name,
    dosage,
    times,
    startDate: startDate || new Date().toISOString().slice(0, 10),
    endDate: endDate || null,
    notes: notes || '',
  });
  res.status(201).json({ success: true, message: 'Medication reminder added', data: { medication } });
});

export const deactivateMedication = catchAsync(async (req, res) => {
  const patient = await getPatientOrThrow(req);
  const medication = await Medication.findOneAndUpdate(
    { _id: req.params.id, patient: patient._id },
    { isActive: false },
    { new: true }
  );
  if (!medication) throw ApiError.notFound('Medication not found');
  res.json({ success: true, message: 'Medication reminder removed', data: { medication } });
});
