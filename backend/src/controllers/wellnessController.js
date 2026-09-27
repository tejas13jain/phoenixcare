import { HealthTip } from '../models/HealthTip.js';
import { WaterLog } from '../models/WaterLog.js';
import { Patient } from '../models/Patient.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

// Deterministic "tip of the day" — same tip for everyone on a given calendar day, rotating
// through the active library, rather than a random pick that could repeat back-to-back.
export const getTodayTip = catchAsync(async (req, res) => {
  const tips = await HealthTip.find({ isActive: true }).sort({ _id: 1 });
  if (tips.length === 0) return res.json({ success: true, data: { tip: null } });

  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const tip = tips[dayIndex % tips.length];

  res.json({ success: true, data: { tip } });
});

export const listTips = catchAsync(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.category) filter.category = req.query.category;
  const tips = await HealthTip.find(filter).sort({ category: 1 });
  res.json({ success: true, data: { tips } });
});

async function getPatientOrThrow(req) {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) throw ApiError.notFound('Patient profile not found');
  return patient;
}

export const getTodayWater = catchAsync(async (req, res) => {
  const patient = await getPatientOrThrow(req);
  const log = await WaterLog.findOne({ patient: patient._id, date: todayString() });
  res.json({ success: true, data: { log: log || { glasses: 0, goal: 8, date: todayString() } } });
});

export const logWater = catchAsync(async (req, res) => {
  const { delta = 1 } = req.body; // +1 to add a glass, -1 to undo
  const patient = await getPatientOrThrow(req);
  const date = todayString();

  let log = await WaterLog.findOne({ patient: patient._id, date });
  if (!log) log = new WaterLog({ patient: patient._id, date, glasses: 0 });

  log.glasses = Math.max(0, Math.min(20, log.glasses + delta));
  await log.save();

  res.json({ success: true, data: { log } });
});
