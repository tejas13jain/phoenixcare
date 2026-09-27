import { HealthTip } from '../models/HealthTip.js';
import { WaterLog } from '../models/WaterLog.js';
import { SleepLog } from '../models/SleepLog.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { WeightLog } from '../models/WeightLog.js';
import { Patient } from '../models/Patient.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { awardXp, getProgress } from '../services/gamificationService.js';
import { getNutritionSuggestions } from '../services/nutritionService.js';

const WATER_LOG_XP = 10;
const SLEEP_LOG_XP = 10;
const ACTIVITY_LOG_XP = 10;
const WEIGHT_LOG_XP = 5;

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

  const wasFirstLogToday = log.glasses === 0;
  log.glasses = Math.max(0, Math.min(20, log.glasses + delta));
  await log.save();

  // Award streak/XP once per day, on the first glass logged — not per tap, so the streak
  // reflects "did you engage today" rather than how many times you clicked.
  let progress = null;
  if (wasFirstLogToday && log.glasses > 0) {
    progress = await awardXp(patient._id, WATER_LOG_XP);
  }

  res.json({ success: true, data: { log, xpAwarded: progress ? WATER_LOG_XP : 0 } });
});

export const getSleepHistory = catchAsync(async (req, res) => {
  const patient = await getPatientOrThrow(req);
  const logs = await SleepLog.find({ patient: patient._id }).sort({ date: -1 }).limit(14);
  res.json({ success: true, data: { logs } });
});

export const logSleep = catchAsync(async (req, res) => {
  const { hours, quality } = req.body;
  if (hours === undefined || hours < 0 || hours > 24) throw ApiError.badRequest('hours must be between 0 and 24');

  const patient = await getPatientOrThrow(req);
  const date = todayString();

  const existed = await SleepLog.findOne({ patient: patient._id, date });
  const log = await SleepLog.findOneAndUpdate(
    { patient: patient._id, date },
    { hours, quality: quality || 'fair' },
    { upsert: true, new: true }
  );

  let xpAwarded = 0;
  if (!existed) {
    await awardXp(patient._id, SLEEP_LOG_XP);
    xpAwarded = SLEEP_LOG_XP;
  }

  res.json({ success: true, data: { log, xpAwarded } });
});

export const getActivityHistory = catchAsync(async (req, res) => {
  const patient = await getPatientOrThrow(req);
  const logs = await ActivityLog.find({ patient: patient._id }).sort({ date: -1 }).limit(14);
  res.json({ success: true, data: { logs } });
});

export const getTodayActivity = catchAsync(async (req, res) => {
  const patient = await getPatientOrThrow(req);
  const log = await ActivityLog.findOne({ patient: patient._id, date: todayString() });
  res.json({ success: true, data: { log: log || { steps: 0, activeMinutes: 0, date: todayString() } } });
});

export const logActivity = catchAsync(async (req, res) => {
  const { steps = 0, activeMinutes = 0 } = req.body;
  const patient = await getPatientOrThrow(req);
  const date = todayString();

  let log = await ActivityLog.findOne({ patient: patient._id, date });
  const wasFirstLogToday = !log;
  if (!log) log = new ActivityLog({ patient: patient._id, date, steps: 0, activeMinutes: 0 });

  log.steps = Math.max(0, log.steps + steps);
  log.activeMinutes = Math.max(0, log.activeMinutes + activeMinutes);
  await log.save();

  let xpAwarded = 0;
  if (wasFirstLogToday) {
    await awardXp(patient._id, ACTIVITY_LOG_XP);
    xpAwarded = ACTIVITY_LOG_XP;
  }

  res.json({ success: true, data: { log, xpAwarded } });
});

export const getWeightHistory = catchAsync(async (req, res) => {
  const patient = await getPatientOrThrow(req);
  const logs = await WeightLog.find({ patient: patient._id }).sort({ date: -1 }).limit(30);
  const bmi = patient.height && patient.weight ? computeBmi(patient.weight, patient.height) : null;
  res.json({ success: true, data: { logs, height: patient.height, currentWeight: patient.weight, bmi } });
});

export const logWeight = catchAsync(async (req, res) => {
  const { weight } = req.body;
  if (!weight || weight <= 0) throw ApiError.badRequest('A valid weight (kg) is required');

  const patient = await getPatientOrThrow(req);
  const date = todayString();

  const existed = await WeightLog.findOne({ patient: patient._id, date });
  const log = await WeightLog.findOneAndUpdate({ patient: patient._id, date }, { weight }, { upsert: true, new: true });

  // Keep the patient's headline weight (used by nutrition targets) in sync with the latest log.
  patient.weight = weight;
  await patient.save();

  let xpAwarded = 0;
  if (!existed) {
    await awardXp(patient._id, WEIGHT_LOG_XP);
    xpAwarded = WEIGHT_LOG_XP;
  }

  const bmi = patient.height ? computeBmi(weight, patient.height) : null;
  res.json({ success: true, data: { log, bmi, xpAwarded } });
});

function computeBmi(weightKg, heightCm) {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export const getMyProgress = catchAsync(async (req, res) => {
  const patient = await getPatientOrThrow(req);
  const progress = await getProgress(patient._id);
  res.json({ success: true, data: { progress } });
});

export const getMyNutrition = catchAsync(async (req, res) => {
  const patient = await getPatientOrThrow(req);
  const suggestions = getNutritionSuggestions({
    weight: patient.weight,
    fitnessGoal: patient.fitnessGoal,
    goesToGym: patient.goesToGym,
  });
  res.json({ success: true, data: { nutrition: suggestions, profile: { weight: patient.weight, fitnessGoal: patient.fitnessGoal, goesToGym: patient.goesToGym } } });
});
