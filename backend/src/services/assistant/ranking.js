import mongoose from 'mongoose';
import { Doctor } from '../../models/Doctor.js';
import { Slot } from '../../models/Slot.js';
import { Appointment } from '../../models/Appointment.js';
import { env } from '../../config/env.js';
import { escapeRegex } from '../../utils/escapeRegex.js';

// ---------------------------------------------------------------------------------------------
// How PhoenixCare decides which doctor is "better" for a patient.
//
// The language model never ranks doctors. It asks this engine, which scores every verified
// doctor on the same published criteria and explains the score. That keeps the answer
// consistent, explainable and impossible to hallucinate. Principles:
//
//  1. Relevance first — a doctor must treat the problem before anything else counts.
//  2. Quality is judged on a *smoothed* rating (Bayesian average). A doctor with one 5-star
//     review must not outrank one with 200 reviews averaging 4.8 — the prior pulls
//     small-sample ratings toward the typical doctor until real evidence accumulates, so new
//     doctors start fair rather than at the bottom.
//  3. Time matters — patients with a problem value being seen soon — but never more than
//     quality (15 points against 30).
//  4. Experience has diminishing returns (logarithmic) and a small weight: years in practice
//     correlate only loosely with outcomes.
//  5. Reliability — doctor-initiated cancellations hurt patients, so they count (with a prior,
//     so one cancellation doesn't sink a new doctor).
//  6. Price is NOT a quality signal. It only matters against a budget the patient states.
//  7. No pay-to-rank: "featured" and any commercial relationship are deliberately ignored.
// ---------------------------------------------------------------------------------------------

export const WEIGHTS = {
  relevance: 35,
  quality: 30,
  availability: 15,
  experience: 8,
  reliability: 6,
  fit: 6,
};

// Rating prior: a typical doctor is ~4.3/5; it counts as 8 "virtual reviews".
export const RATING_PRIOR = { mean: 4.3, strength: 8 };

// Hard cap on the candidates scored per query.
const MAX_CANDIDATES = 60;
const SLOT_WINDOW_DAYS = 14;
const MIN_LEAD_MINUTES = 30; // a slot starting in 10 minutes isn't bookable in practice
const RELIABILITY_WINDOW_DAYS = 180;

const clamp01 = (n) => Math.max(0, Math.min(1, n));
const round1 = (n) => Math.round(n * 10) / 10;

export function smoothedRating(rating, count) {
  const n = Number(count) || 0;
  const r = n > 0 ? Number(rating) || 0 : 0;
  return (n * r + RATING_PRIOR.strength * RATING_PRIOR.mean) / (n + RATING_PRIOR.strength);
}

// ---- Clinic-local time (slots are stored as the clinic's local date/time strings) -------------

export function clinicNow(timeZone = env.clinicTimeZone, at = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

const toMinutes = (date, time) => {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) / 60000;
};

export function addDays(date, days) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const to12h = (time) => {
  const [hh, mm] = time.split(':').map(Number);
  return `${hh % 12 === 0 ? 12 : hh % 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
};

// "Today 5:30 PM", "Tomorrow 10:00 AM", "Wed 7 Oct, 10:00 AM"
export function describeSlot(date, startTime, now = clinicNow()) {
  const dayDiff = Math.round((toMinutes(date, '00:00') - toMinutes(now.date, '00:00')) / 1440);
  let day;
  if (dayDiff === 0) day = 'Today';
  else if (dayDiff === 1) day = 'Tomorrow';
  else {
    const [y, m, d] = date.split('-').map(Number);
    day = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  }
  return `${day}, ${to12h(startTime)}`;
}

// ---- Pure scoring --------------------------------------------------------------------------

const RELEVANCE_BY_RANK = [1, 0.75, 0.55];

function availabilityScore(hoursAway) {
  if (hoursAway == null) return 0;
  if (hoursAway <= 24) return 1;
  if (hoursAway <= 48) return 0.8;
  if (hoursAway <= 72) return 0.6;
  if (hoursAway <= 168) return 0.35;
  return 0.15;
}

const experienceScore = (years) => clamp01(Math.log(1 + Math.max(0, Number(years) || 0)) / Math.log(26));

// Prior of 3 good outcomes and 1 bad: an unknown doctor scores 0.75, a proven one approaches 1.
const reliabilityScore = (completed, cancelledByDoctor) => (completed + 3) / (completed + cancelledByDoctor + 4);

/**
 * Scores one doctor for one patient need.
 * @param doctor  lean Doctor with `name`, plus `stats` { completed, cancelledByDoctor } and `nextSlot`
 * @param ctx     { specialties: string[] (most relevant first), mode?, language?, maxFee?, now }
 */
export function scoreDoctor(doctor, ctx) {
  const now = ctx.now || clinicNow();

  // Relevance
  const wanted = (ctx.specialties || []).map((s) => s.toLowerCase());
  let rank = -1;
  (doctor.specialties || []).forEach((s) => {
    const i = wanted.indexOf(String(s).toLowerCase());
    if (i !== -1 && (rank === -1 || i < rank)) rank = i;
  });
  const relevance = wanted.length ? (rank === -1 ? 0 : RELEVANCE_BY_RANK[Math.min(rank, 2)]) : 0.5;

  // Quality
  const smoothed = smoothedRating(doctor.rating, doctor.ratingCount);
  const quality = clamp01((smoothed - 3) / 2);

  // Availability
  let hoursAway = null;
  if (doctor.nextSlot) {
    hoursAway = (toMinutes(doctor.nextSlot.date, doctor.nextSlot.startTime) - toMinutes(now.date, now.time)) / 60;
  }
  const availability = availabilityScore(hoursAway);

  // Experience, reliability
  const experience = experienceScore(doctor.experienceYears);
  const stats = doctor.stats || { completed: 0, cancelledByDoctor: 0 };
  const reliability = reliabilityScore(stats.completed, stats.cancelledByDoctor);

  // Fit: language (soft) and budget (price is only used against a stated budget)
  const refMode = referenceMode(doctor, ctx.mode, ctx.maxFee);
  const fee = refMode ? doctor.fee?.[refMode] : null;
  const languageFit = ctx.language
    ? (doctor.languages || []).some((l) => l.toLowerCase().includes(ctx.language.toLowerCase())) ? 1 : 0
    : 0.5;
  const priceFit = ctx.maxFee != null && fee != null && ctx.maxFee > 0 ? clamp01(1 - 0.4 * (fee / ctx.maxFee)) : 0.5;
  const fit = 0.5 * languageFit + 0.5 * priceFit;

  const parts = { relevance, quality, availability, experience, reliability, fit };
  const breakdown = Object.keys(WEIGHTS).map((key) => ({
    key,
    max: WEIGHTS[key],
    points: round1(parts[key] * WEIGHTS[key]),
  }));
  const score = round1(breakdown.reduce((sum, b) => sum + b.points, 0));

  return { score, breakdown, parts, smoothed, hoursAway, matchedSpecialty: rank === -1 ? null : ctx.specialties[rank], matchRank: rank, languageMatch: ctx.language ? languageFit === 1 : null };
}

const MODE_PRIORITY = ['video', 'audio', 'chat', 'in_clinic'];

/**
 * Which consultation mode a fee refers to. The patient's chosen mode if they gave one;
 * otherwise video (the default the booking page opens with), or — when they gave a budget —
 * the first mode that fits it. The price shown always belongs to this mode, so it matches
 * what the patient is then asked to pay.
 */
export function referenceMode(doctor, mode, maxFee) {
  if (mode) return mode;
  const offered = MODE_PRIORITY.filter((m) => (doctor.consultationModes || []).includes(m) && typeof doctor.fee?.[m] === 'number');
  if (maxFee != null) {
    const fitting = offered.find((m) => doctor.fee[m] <= maxFee);
    if (fitting) return fitting;
  }
  return offered[0] || null;
}

// Deterministic order: score, then smoothed rating, then sooner slot, then id.
export function compareScored(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if (b.smoothed !== a.smoothed) return b.smoothed - a.smoothed;
  const ah = a.hoursAway ?? Infinity;
  const bh = b.hoursAway ?? Infinity;
  if (ah !== bh) return ah - bh;
  return String(a.id).localeCompare(String(b.id));
}

// Plain-language reasons shown to the patient (and given to the model).
export function buildReasons(doctor, scored, ctx) {
  const reasons = [];
  if (scored.matchedSpecialty) {
    reasons.push(scored.matchRank === 0 ? `${scored.matchedSpecialty} — matches what you described` : `${scored.matchedSpecialty} — a secondary match for your concern`);
  }

  const n = doctor.ratingCount || 0;
  if (n >= 5) reasons.push(`Rated ${round1(doctor.rating)}/5 by ${n} patients`);
  else if (n > 0) reasons.push(`Rated ${round1(doctor.rating)}/5 (only ${n} review${n === 1 ? '' : 's'} so far)`);
  else reasons.push('New on PhoenixCare — no reviews yet');

  if (doctor.experienceYears >= 1) reasons.push(`${doctor.experienceYears} years of experience`);

  if (doctor.nextSlot) reasons.push(`Earliest slot: ${doctor.nextSlot.label}`);
  else reasons.push(`No open slots in the next ${SLOT_WINDOW_DAYS} days`);

  const { completed, cancelledByDoctor } = doctor.stats || { completed: 0, cancelledByDoctor: 0 };
  const total = completed + cancelledByDoctor;
  if (completed >= 10 && cancelledByDoctor / total <= 0.02) reasons.push('Rarely cancels appointments');
  else if (cancelledByDoctor >= 3 && cancelledByDoctor / total >= 0.1) reasons.push('Has cancelled some recent appointments');

  if (scored.languageMatch) reasons.push(`Speaks ${ctx.language}`);
  return reasons;
}

// ---- Data access ---------------------------------------------------------------------------

// A slot starting in a few minutes isn't realistically bookable; require a short lead time.
function leadCutoffFor(now) {
  const t = toMinutes(now.date, now.time) + MIN_LEAD_MINUTES;
  const d = new Date(t * 60000);
  return { date: d.toISOString().slice(0, 10), time: d.toISOString().slice(11, 16) };
}

const notBeforeLead = (cutoff) => ({
  $match: { $expr: { $or: [{ $gt: ['$date', cutoff.date] }, { $gte: ['$startTime', cutoff.time] }] } },
});

const slotView = (slot, now) => ({
  slotId: String(slot._id),
  date: slot.date,
  startTime: slot.startTime,
  endTime: slot.endTime,
  modes: slot.modes,
  label: describeSlot(slot.date, slot.startTime, now),
});

async function loadNextSlots(doctorIds, ctx, now) {
  if (!doctorIds.length) return new Map();
  const cutoff = leadCutoffFor(now);

  const match = {
    doctor: { $in: doctorIds },
    status: 'available',
    date: { $gte: cutoff.date, $lte: addDays(now.date, SLOT_WINDOW_DAYS) },
  };
  if (ctx.mode) match.modes = ctx.mode;

  const slots = await Slot.aggregate([
    { $match: match },
    notBeforeLead(cutoff),
    { $sort: { date: 1, startTime: 1 } },
    { $group: { _id: '$doctor', first: { $first: '$$ROOT' }, openSlots: { $sum: 1 } } },
  ]);

  return new Map(slots.map((g) => [String(g._id), { ...slotView(g.first, now), openSlots: g.openSlots }]));
}

/** Open, still-bookable slots for one doctor (earliest first). */
export async function listOpenSlots(doctorId, { date, days = 7, mode, limit = 24, now = clinicNow() } = {}) {
  const cutoff = leadCutoffFor(now);
  const from = date && date > cutoff.date ? date : cutoff.date;
  const to = date || addDays(now.date, Math.min(days, SLOT_WINDOW_DAYS));
  // Aggregation pipelines don't cast ids the way find() does, so convert explicitly.
  const match = { doctor: new mongoose.Types.ObjectId(String(doctorId)), status: 'available', date: { $gte: from, $lte: to } };
  if (mode) match.modes = mode;

  const slots = await Slot.aggregate([{ $match: match }, notBeforeLead(cutoff), { $sort: { date: 1, startTime: 1 } }, { $limit: limit }]);
  return slots.map((s) => slotView(s, now));
}

/** A single slot, only if it is still open and bookable. */
export async function findBookableSlot(slotId, doctorId, now = clinicNow()) {
  const slot = await Slot.findOne({ _id: slotId, doctor: doctorId, status: 'available' }).lean();
  if (!slot) return null;
  const cutoff = leadCutoffFor(now);
  const bookable = slot.date > cutoff.date || (slot.date === cutoff.date && slot.startTime >= cutoff.time);
  return bookable ? slotView(slot, now) : null;
}

async function loadReliability(doctorIds, now) {
  if (!doctorIds.length) return new Map();
  const since = new Date(Date.now() - RELIABILITY_WINDOW_DAYS * 86400000);
  const rows = await Appointment.aggregate([
    { $match: { doctor: { $in: doctorIds }, createdAt: { $gte: since } } },
    {
      $group: {
        _id: '$doctor',
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelledByDoctor: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'cancelled'] }, { $eq: ['$cancelledBy', 'doctor'] }] }, 1, 0] } },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), { completed: r.completed, cancelledByDoctor: r.cancelledByDoctor }]));
}

// Free text from the database that may reach the language model: clamp and strip control
// characters so a doctor-written field can't smuggle in long or odd instructions.
export const safeText = (value, max = 80) =>
  String(value ?? '')
    .replace(/[\u0000-\u001f\u007f<>`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

const PUBLIC_FIELDS =
  'user specialties qualifications experienceYears languages consultationModes fee city rating ratingCount isAcceptingNewPatients kycStatus';

function toResult(doctor, scored, ctx) {
  const refMode = referenceMode(doctor, ctx.mode, ctx.maxFee);
  const fees = Object.fromEntries((doctor.consultationModes || []).filter((m) => typeof doctor.fee?.[m] === 'number').map((m) => [m, doctor.fee[m]]));
  return {
    id: String(doctor._id),
    name: safeText(doctor.user?.name, 80),
    specialties: (doctor.specialties || []).map((s) => safeText(s, 40)),
    qualifications: (doctor.qualifications || []).slice(0, 3).map((q) => safeText(q, 40)),
    experienceYears: doctor.experienceYears || 0,
    rating: round1(doctor.rating || 0),
    ratingCount: doctor.ratingCount || 0,
    city: safeText(doctor.city, 40),
    languages: (doctor.languages || []).slice(0, 5).map((l) => safeText(l, 20)),
    modes: doctor.consultationModes || [],
    fees,
    fee: refMode ? doctor.fee?.[refMode] ?? null : null,
    feeMode: refMode,
    nextSlot: doctor.nextSlot || null,
    score: scored.score,
    breakdown: scored.breakdown,
    reasons: buildReasons(doctor, scored, ctx),
    newcomer: (doctor.ratingCount || 0) < 5,
    // internal ordering keys (stripped before sending)
    smoothed: scored.smoothed,
    hoursAway: scored.hoursAway,
  };
}

async function hydrate(doctors, ctx) {
  const now = ctx.now || clinicNow();
  const ids = doctors.map((d) => d._id);
  const [slots, reliability] = await Promise.all([loadNextSlots(ids, ctx, now), loadReliability(ids, now)]);
  return doctors.map((d) => ({
    ...d,
    nextSlot: slots.get(String(d._id)) || null,
    stats: reliability.get(String(d._id)) || { completed: 0, cancelledByDoctor: 0 },
  }));
}

// Adds comparison badges ("Best overall", "Earliest available", ...) across the returned set.
export function addBadges(results) {
  if (results.length < 2) {
    if (results[0]) results[0].badges = ['best_overall'];
    return results;
  }
  results.forEach((r) => (r.badges = []));
  results[0].badges.push('best_overall');

  const pick = (items, better) => items.reduce((best, cur) => (best === null || better(cur, best) ? cur : best), null);

  const withSlot = results.filter((r) => r.nextSlot);
  const earliest = pick(withSlot, (a, b) => a.hoursAway < b.hoursAway);
  if (earliest && withSlot.length > 1) earliest.badges.push('earliest');

  const rated = results.filter((r) => r.ratingCount >= 10);
  const topRated = pick(rated, (a, b) => a.smoothed > b.smoothed);
  if (topRated && rated.length > 1) topRated.badges.push('top_rated');

  const seasoned = results.filter((r) => r.experienceYears >= 10);
  const mostExperienced = pick(seasoned, (a, b) => a.experienceYears > b.experienceYears);
  if (mostExperienced && seasoned.length > 1) mostExperienced.badges.push('most_experienced');

  const priced = results.filter((r) => typeof r.fee === 'number');
  const cheapest = pick(priced, (a, b) => a.fee < b.fee);
  if (cheapest && priced.length > 1 && new Set(priced.map((r) => r.fee)).size > 1) cheapest.badges.push('lowest_fee');

  return results;
}

const stripInternal = ({ smoothed, hoursAway, ...rest }) => rest;

/**
 * Finds and ranks verified doctors for a patient need.
 * @returns { doctors: Result[], budgetRelaxed: boolean }
 */
export async function rankDoctors(ctx, { limit = 3 } = {}) {
  const base = { kycStatus: 'verified', isAcceptingNewPatients: true };
  if (ctx.specialties?.length) {
    base.specialties = { $in: ctx.specialties.map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i')) };
  }
  if (ctx.mode) base.consultationModes = ctx.mode;
  if (ctx.mode === 'in_clinic' && ctx.city) base.city = { $regex: `^${escapeRegex(ctx.city)}$`, $options: 'i' };

  const withBudget = { ...base };
  if (ctx.maxFee != null) {
    withBudget.$or = (ctx.mode ? [ctx.mode] : ['video', 'audio', 'chat', 'in_clinic']).map((m) => ({ [`fee.${m}`]: { $lte: ctx.maxFee } }));
  }

  const find = (filter) => Doctor.find(filter).select(PUBLIC_FIELDS).populate('user', 'name').sort({ rating: -1, ratingCount: -1 }).limit(MAX_CANDIDATES).lean();

  let candidates = await find(withBudget);
  let budgetRelaxed = false;
  if (!candidates.length && ctx.maxFee != null) {
    candidates = await find(base);
    budgetRelaxed = candidates.length > 0;
  }

  const hydrated = await hydrate(candidates, ctx);
  const results = hydrated
    .map((d) => ({ d, scored: scoreDoctor(d, ctx) }))
    // A doctor who doesn't treat the problem never makes the list, however well rated.
    .filter(({ scored }) => !ctx.specialties?.length || scored.parts.relevance > 0)
    .map(({ d, scored }) => toResult(d, scored, ctx))
    .sort(compareScored)
    .slice(0, limit);

  addBadges(results);
  return { doctors: results.map(stripInternal), budgetRelaxed };
}

/** Loads specific doctors (for details / comparison) scored against the same need. */
export async function scoreDoctorsByIds(ids, ctx) {
  const doctors = await Doctor.find({ _id: { $in: ids }, kycStatus: 'verified' }).select(PUBLIC_FIELDS).populate('user', 'name').lean();
  const hydrated = await hydrate(doctors, ctx);
  const results = hydrated.map((d) => {
    // Without an explicit need, judge each doctor against their own main specialty.
    const own = { ...ctx, specialties: ctx.specialties?.length ? ctx.specialties : d.specialties.slice(0, 1) };
    return toResult(d, scoreDoctor(d, own), own);
  });
  results.sort(compareScored);
  addBadges(results);
  return results.map(stripInternal);
}
