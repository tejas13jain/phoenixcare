import { z } from 'zod';
import { logger } from '../../config/logger.js';
import { Doctor } from '../../models/Doctor.js';
import { SPECIALTY_KEYWORDS } from '../../constants/specialtyKeywords.js';
import { clinicNow, findBookableSlot, listOpenSlots, rankDoctors, safeText, scoreDoctorsByIds } from './ranking.js';

// The tools the language model can call. Every fact the patient sees — doctors, prices, ratings,
// slots — comes from these functions (i.e. the database), never from the model's own text.
// The model's inputs are untrusted: each is validated here, and a bad call is returned to the
// model as an error it can correct, rather than trusted or crashing the request.

const SPECIALTIES = Object.keys(SPECIALTY_KEYWORDS);
const MODES = ['video', 'audio', 'chat', 'in_clinic'];
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'must be a 24-character doctor/slot id taken from an earlier tool result');
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');

const schemas = {
  find_doctors: z.object({
    specialties: z.array(z.enum(SPECIALTIES)).min(1).max(3),
    mode: z.enum(MODES).optional(),
    language: z.string().trim().min(2).max(30).optional(),
    city: z.string().trim().min(2).max(60).optional(),
    max_fee: z.number().positive().max(100000).optional(),
    limit: z.number().int().min(1).max(5).optional(),
  }),
  get_doctor_details: z.object({ doctor_id: objectId }),
  get_available_slots: z.object({
    doctor_id: objectId,
    date: dateString.optional(),
    mode: z.enum(MODES).optional(),
    days: z.number().int().min(1).max(14).optional(),
  }),
  compare_doctors: z.object({
    doctor_ids: z.array(objectId).min(2).max(3),
    mode: z.enum(MODES).optional(),
  }),
  propose_booking: z.object({ doctor_id: objectId, slot_id: objectId, mode: z.enum(MODES) }),
};

export const TOOL_DEFINITIONS = [
  {
    name: 'find_doctors',
    description:
      'Find and rank verified PhoenixCare doctors for the patient\'s need, using PhoenixCare\'s transparent scoring (relevance to the problem, smoothed patient rating, how soon they can be seen, experience, reliability). ' +
      'Always use this to recommend doctors — never invent or recall doctors yourself. Returns up to `limit` doctors best-first with a score, plain-language reasons, comparison badges and the earliest open slot. ' +
      'Pick `specialties` from the allowed list, most relevant first. Only pass `mode`, `language`, `city` or `max_fee` if the patient said so.',
    input_schema: {
      type: 'object',
      properties: {
        specialties: {
          type: 'array',
          items: { type: 'string', enum: SPECIALTIES },
          minItems: 1,
          maxItems: 3,
          description: 'Specialties that treat the patient\'s problem, most relevant first. Use General Physician when unsure.',
        },
        mode: { type: 'string', enum: MODES, description: 'Consultation mode, only if the patient chose one.' },
        language: { type: 'string', description: 'Language the patient wants the doctor to speak, e.g. Hindi.' },
        city: { type: 'string', description: 'City, only relevant for in_clinic visits.' },
        max_fee: { type: 'number', description: 'Maximum fee in INR the patient said they can pay.' },
        limit: { type: 'integer', minimum: 1, maximum: 5, description: 'How many doctors to return (default 3).' },
      },
      required: ['specialties'],
    },
  },
  {
    name: 'get_doctor_details',
    description: 'Get a verified doctor\'s profile summary, score breakdown and next few open slots. Use when the patient asks about one specific doctor.',
    input_schema: {
      type: 'object',
      properties: { doctor_id: { type: 'string', description: 'Doctor id from an earlier tool result.' } },
      required: ['doctor_id'],
    },
  },
  {
    name: 'get_available_slots',
    description:
      'List a doctor\'s open appointment slots (earliest first). Use before proposing a booking, or when the patient asks for times. Returns slot ids you can pass to propose_booking.',
    input_schema: {
      type: 'object',
      properties: {
        doctor_id: { type: 'string' },
        date: { type: 'string', description: 'A single day, YYYY-MM-DD. Omit to list the next few days.' },
        mode: { type: 'string', enum: MODES },
        days: { type: 'integer', minimum: 1, maximum: 14, description: 'How many days ahead to look when no date is given (default 7).' },
      },
      required: ['doctor_id'],
    },
  },
  {
    name: 'compare_doctors',
    description:
      'Compare 2–3 doctors side by side on the same criteria, with a deterministic summary of who is best overall and where each differs (soonest, top rated, most experienced, lowest fee). Use when the patient is choosing between doctors.',
    input_schema: {
      type: 'object',
      properties: {
        doctor_ids: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 },
        mode: { type: 'string', enum: MODES },
      },
      required: ['doctor_ids'],
    },
  },
  {
    name: 'propose_booking',
    description:
      'Prepare a booking for the patient to confirm. This does NOT book anything or take payment — it checks the slot is still open and shows the patient a "Review & book" card; they confirm and pay on the next screen. ' +
      'Only call it after the patient has chosen a doctor, a time and a mode.',
    input_schema: {
      type: 'object',
      properties: {
        doctor_id: { type: 'string' },
        slot_id: { type: 'string', description: 'Slot id from get_available_slots.' },
        mode: { type: 'string', enum: MODES },
      },
      required: ['doctor_id', 'slot_id', 'mode'],
    },
  },
];

// ---- helpers -------------------------------------------------------------------------------

const ok = (data) => ({ content: JSON.stringify(data), isError: false });
const fail = (message, extra = {}) => ({ content: JSON.stringify({ error: message, ...extra }), isError: true });

// What the model sees about a doctor: compact, and with no free text beyond names/specialties.
function forModel(d) {
  return {
    id: d.id,
    name: d.name,
    specialties: d.specialties,
    experience_years: d.experienceYears,
    rating: d.rating,
    review_count: d.ratingCount,
    new_on_platform: d.newcomer,
    languages: d.languages,
    modes: d.modes,
    fees_inr: d.fees,
    shown_fee_inr: d.fee,
    shown_fee_is_for_mode: d.feeMode,
    next_slot: d.nextSlot ? { slot_id: d.nextSlot.slotId, when: d.nextSlot.label, modes: d.nextSlot.modes } : null,
    score_out_of_100: d.score,
    badges: d.badges || [],
    reasons: d.reasons,
  };
}

function remember(session, doctors) {
  doctors.forEach((d) => session.shown.set(d.id, d.name));
}

function comparisonVerdict(doctors) {
  if (doctors.length < 2) return '';
  const top = doctors[0];
  const lines = [`${top.name} scores highest overall (${top.score}/100).`];
  for (const d of doctors) {
    if (d.badges?.includes('earliest') && d.nextSlot) lines.push(`${d.name} can see you soonest (${d.nextSlot.label}).`);
    if (d.badges?.includes('top_rated')) lines.push(`${d.name} has the strongest patient ratings (${d.rating}/5 from ${d.ratingCount} reviews).`);
    if (d.badges?.includes('most_experienced')) lines.push(`${d.name} has the most experience (${d.experienceYears} years).`);
    if (d.badges?.includes('lowest_fee')) lines.push(`${d.name} has the lowest fee (₹${d.fee}).`);
  }
  return lines.join(' ');
}

// ---- executors -----------------------------------------------------------------------------

const executors = {
  async find_doctors(input, session) {
    const ctx = {
      specialties: input.specialties,
      mode: input.mode,
      language: input.language ? safeText(input.language, 30) : undefined,
      city: input.city ? safeText(input.city, 60) : undefined,
      maxFee: input.max_fee,
      now: session.now,
    };
    const { doctors, budgetRelaxed } = await rankDoctors(ctx, { limit: input.limit || 3 });
    session.lastNeed = { specialties: ctx.specialties, mode: ctx.mode, language: ctx.language, maxFee: ctx.maxFee };

    if (!doctors.length) {
      return ok({
        doctors: [],
        note: 'No verified doctors currently match. Offer to try a different specialty (General Physician is a safe starting point) or a different consultation mode. Do not invent doctors.',
      });
    }

    remember(session, doctors);
    session.cards.push({ type: 'doctors', need: { specialties: ctx.specialties, mode: ctx.mode || null }, budgetRelaxed, doctors });

    return ok({
      doctors: doctors.map(forModel),
      ...(budgetRelaxed && {
        note: `No doctors were within the patient's budget of ₹${ctx.maxFee}; these are the closest matches. Say so plainly.`,
      }),
      scoring: 'Score is out of 100: relevance 35, patient rating (smoothed for few reviews) 30, how soon they can be seen 15, experience 8, reliability 6, fit 6. Featured status and fees do not raise a doctor\'s rank.',
    });
  },

  async get_doctor_details(input, session) {
    const [d] = await scoreDoctorsByIds([input.doctor_id], { ...(session.lastNeed || {}), now: session.now });
    if (!d) return fail('Doctor not found or not currently available on PhoenixCare.');
    const slots = await listOpenSlots(input.doctor_id, { days: 7, limit: 5, now: session.now });
    remember(session, [d]);
    session.cards.push({ type: 'doctors', need: null, doctors: [d] });
    return ok({
      doctor: { ...forModel(d), qualifications: d.qualifications, city: d.city, score_breakdown: d.breakdown },
      upcoming_slots: slots.map((s) => ({ slot_id: s.slotId, when: s.label, modes: s.modes })),
    });
  },

  async get_available_slots(input, session) {
    const doctor = await Doctor.findOne({ _id: input.doctor_id, kycStatus: 'verified' }).select('user consultationModes').populate('user', 'name').lean();
    if (!doctor) return fail('Doctor not found or not currently available on PhoenixCare.');
    if (input.mode && !doctor.consultationModes.includes(input.mode)) {
      return fail(`This doctor does not offer ${input.mode} consultations.`, { offered_modes: doctor.consultationModes });
    }
    const slots = await listOpenSlots(input.doctor_id, { date: input.date, days: input.days || 7, mode: input.mode, now: session.now });
    if (!slots.length) {
      return ok({ slots: [], note: 'No open slots in that period. Offer to check another day or another doctor.' });
    }
    const name = safeText(doctor.user?.name, 80);
    session.shown.set(String(doctor._id), name);
    session.cards.push({ type: 'slots', doctor: { id: String(doctor._id), name }, mode: input.mode || null, slots });
    return ok({
      doctor: name,
      slots: slots.map((s) => ({ slot_id: s.slotId, when: s.label, modes: s.modes })),
    });
  },

  async compare_doctors(input, session) {
    const unique = [...new Set(input.doctor_ids)];
    if (unique.length < 2) return fail('Provide at least two different doctor ids.');
    const doctors = await scoreDoctorsByIds(unique, { ...(session.lastNeed || {}), mode: input.mode || session.lastNeed?.mode, now: session.now });
    if (doctors.length < 2) return fail('Fewer than two of those doctors are available to compare.');
    const verdict = comparisonVerdict(doctors);
    remember(session, doctors);
    session.cards.push({ type: 'comparison', doctors, verdict });
    return ok({ comparison: doctors.map(forModel), verdict, how_to_use: 'Explain the trade-offs in plain words and give a clear recommendation based on what the patient said matters most. Do not state anything not in this data.' });
  },

  async propose_booking(input, session) {
    const doctor = await Doctor.findOne({ _id: input.doctor_id, kycStatus: 'verified', isAcceptingNewPatients: true })
      .select('user consultationModes fee')
      .populate('user', 'name')
      .lean();
    if (!doctor) return fail('Doctor not found or not accepting patients.');
    if (!doctor.consultationModes.includes(input.mode)) {
      return fail(`This doctor does not offer ${input.mode} consultations.`, { offered_modes: doctor.consultationModes });
    }
    const slot = await findBookableSlot(input.slot_id, input.doctor_id, session.now);
    if (!slot) return fail('That slot is no longer available. Call get_available_slots again and offer fresh times.');
    if (slot.modes?.length && !slot.modes.includes(input.mode)) {
      return fail(`That slot is not available for ${input.mode}.`, { slot_modes: slot.modes });
    }

    const booking = {
      doctorId: String(doctor._id),
      doctorName: safeText(doctor.user?.name, 80),
      slotId: slot.slotId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: slot.label,
      mode: input.mode,
      fee: doctor.fee?.[input.mode] ?? null,
    };
    session.cards.push({ type: 'booking', booking });
    return ok({
      prepared: true,
      booking: { doctor: booking.doctorName, when: booking.label, mode: booking.mode, fee_inr: booking.fee },
      next_step:
        'Nothing is booked yet. Tell the patient to press the "Review & book" button below your message, check the details and pay on the next screen. Do not say the appointment is confirmed.',
    });
  },
};

/**
 * Runs one tool call. Always returns { content, isError } for a tool_result block.
 * @param session { cards: [], shown: Map, lastNeed, now }
 */
export async function runTool(name, rawInput, session) {
  const schema = schemas[name];
  if (!schema || !executors[name]) return fail(`Unknown tool "${name}".`);

  const parsed = schema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('Invalid tool input.', { issues: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.') || 'input'}: ${i.message}`) });
  }
  // The same session object is passed through so tools can record state (cards, lastNeed).
  session.now = session.now || clinicNow();
  try {
    return await executors[name](parsed.data, session);
  } catch (err) {
    logger.error(`Assistant tool ${name} failed: ${err.message}`);
    return fail('The lookup failed. Apologise briefly and suggest the patient try again or browse doctors directly.');
  }
}
