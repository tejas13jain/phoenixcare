import { Patient } from '../models/Patient.js';
import { Appointment } from '../models/Appointment.js';
import { SleepLog } from '../models/SleepLog.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Medication } from '../models/Medication.js';

const LEVEL_XP_STEP = 100; // 100 XP per level

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(dateA, dateB) {
  return Math.round((new Date(dateA) - new Date(dateB)) / (24 * 60 * 60 * 1000));
}

export function levelFromXp(xp) {
  return Math.floor(xp / LEVEL_XP_STEP) + 1;
}

export function xpIntoLevel(xp) {
  return xp % LEVEL_XP_STEP;
}

// Awards XP and updates the daily streak. Streak logic: logging in/engaging again on the
// same day doesn't change the streak; the very next calendar day extends it; skipping a day
// resets it to 1. Call this once per meaningful engagement action (not per API call) —
// callers are responsible for "once per day" gating where that matters (e.g. water logging).
export async function awardXp(patientId, amount) {
  const patient = await Patient.findById(patientId);
  if (!patient) return null;

  const today = todayString();
  const g = patient.gamification || {};
  const last = g.lastActivityDate;

  let currentStreak = g.currentStreak || 0;
  if (!last) currentStreak = 1;
  else {
    const diff = daysBetween(today, last);
    if (diff === 0) currentStreak = g.currentStreak || 1;
    else if (diff === 1) currentStreak = (g.currentStreak || 0) + 1;
    else currentStreak = 1;
  }

  patient.gamification = {
    totalXp: (g.totalXp || 0) + amount,
    currentStreak,
    longestStreak: Math.max(g.longestStreak || 0, currentStreak),
    lastActivityDate: today,
  };
  await patient.save();
  return patient.gamification;
}

const BADGE_DEFS = [
  { code: 'first_step', label: 'First Step', icon: 'footprints', check: (ctx) => ctx.totalXp > 0 },
  { code: 'streak_3', label: 'Getting Started', icon: 'flame', check: (ctx) => ctx.longestStreak >= 3 },
  { code: 'streak_7', label: 'Week Warrior', icon: 'flame', check: (ctx) => ctx.longestStreak >= 7 },
  { code: 'streak_30', label: 'Consistency Champion', icon: 'flame', check: (ctx) => ctx.longestStreak >= 30 },
  { code: 'level_5', label: 'Level 5 Reached', icon: 'trophy', check: (ctx) => ctx.level >= 5 },
  { code: 'first_appointment', label: 'First Consultation', icon: 'stethoscope', check: (ctx) => ctx.appointmentCount >= 1 },
  { code: 'hydration_hero', label: 'Hydration Hero', icon: 'droplet', check: (ctx) => ctx.totalXp >= 200 },
  { code: 'sleep_tracker', label: 'Sleep Tracker', icon: 'moon', check: (ctx) => ctx.sleepLogCount >= 1 },
  { code: 'on_the_move', label: 'On the Move', icon: 'footprints', check: (ctx) => ctx.activityLogCount >= 3 },
  { code: 'med_organizer', label: 'Med Organizer', icon: 'pill', check: (ctx) => ctx.medicationCount >= 1 },
];

export async function getProgress(patientId) {
  const patient = await Patient.findById(patientId);
  if (!patient) return null;

  const g = patient.gamification || { totalXp: 0, currentStreak: 0, longestStreak: 0 };
  const [appointmentCount, sleepLogCount, activityLogCount, medicationCount] = await Promise.all([
    Appointment.countDocuments({ patient: patientId, status: { $ne: 'cancelled' } }),
    SleepLog.countDocuments({ patient: patientId }),
    ActivityLog.countDocuments({ patient: patientId }),
    Medication.countDocuments({ patient: patientId, isActive: true }),
  ]);
  const level = levelFromXp(g.totalXp);

  const ctx = { totalXp: g.totalXp, longestStreak: g.longestStreak, level, appointmentCount, sleepLogCount, activityLogCount, medicationCount };
  const badges = BADGE_DEFS.map((b) => ({ code: b.code, label: b.label, icon: b.icon, unlocked: b.check(ctx) }));

  return {
    totalXp: g.totalXp,
    level,
    xpIntoLevel: xpIntoLevel(g.totalXp),
    xpForNextLevel: LEVEL_XP_STEP,
    currentStreak: g.currentStreak,
    longestStreak: g.longestStreak,
    badges,
  };
}
