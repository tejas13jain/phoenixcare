import { Patient } from '../models/Patient.js';
import { HealthRecord } from '../models/HealthRecord.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

export const uploadHealthRecord = catchAsync(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) throw ApiError.notFound('Patient profile not found');

  const fileUrl = req.file?.path || req.validated.body.fileUrl;
  const record = await HealthRecord.create({
    patient: patient._id,
    ...req.validated.body,
    fileUrl,
  });

  res.status(201).json({ success: true, message: 'Health record saved', data: { record } });
});

export const listMyHealthRecords = catchAsync(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) throw ApiError.notFound('Patient profile not found');

  const filter = { patient: patient._id };
  if (req.query.type) filter.type = req.query.type;

  const records = await HealthRecord.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: { records } });
});

// Doctors may view a patient's vault only in the context of an active/past shared appointment —
// enforcement of that lives at the route layer via requireAuth + role checks upstream of here in a
// future iteration; for now this endpoint is patient-scoped self-service only.
export const deleteHealthRecord = catchAsync(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  const record = await HealthRecord.findOne({ _id: req.params.id, patient: patient._id });
  if (!record) throw ApiError.notFound('Health record not found');
  await record.deleteOne();
  res.json({ success: true, message: 'Health record deleted' });
});
