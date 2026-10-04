import { SPECIALTY_KEYWORDS } from '../../constants/specialtyKeywords.js';
import { rankDoctors } from './ranking.js';

// "Guided mode": the assistant without a language model. It reads the patient's words against
// the symptom keyword list, then uses the very same ranking engine as the AI path. It's used
// when no API key is configured, when the AI service is down or over its daily budget, or when
// a safety filter declines a request — so the feature never simply disappears, and a patient
// who prefers not to use AI still gets the same doctor ranking.

const STARTERS = ['Fever and cough', 'Skin rash', 'Stress or anxiety', 'My child is unwell', 'Tooth pain', 'Weight and diet'];

// Counts how many of each specialty's symptom keywords appear in the text.
export function matchSpecialtiesByHits(text) {
  const lower = String(text || '').toLowerCase();
  return Object.entries(SPECIALTY_KEYWORDS)
    .map(([specialty, keywords]) => ({
      specialty,
      hits: keywords.filter((k) => (k.length <= 3 ? new RegExp(`\\b${k}\\b`).test(lower) : lower.includes(k))).length,
    }))
    .filter((m) => m.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map((m) => m.specialty);
}

export async function guidedReply({ text, now, session }) {
  const matched = matchSpecialtiesByHits(text);

  if (!matched.length) {
    return {
      reply:
        'Tell me what is bothering you — for example fever, a skin rash, stress, tooth pain, or a child’s health problem — and I’ll suggest the right kind of doctor and show the best available options. ' +
        'If you’re not sure, a General Physician is a good first step.',
      cards: [],
      suggestions: STARTERS,
    };
  }

  const specialties = matched.slice(0, 2);
  const { doctors } = await rankDoctors({ specialties, now }, { limit: 3 });
  const lead = specialties[0];

  if (!doctors.length) {
    return {
      reply: `A ${lead} usually helps with this, but I can’t find an available ${lead} on PhoenixCare right now. You could try a General Physician, or browse all doctors.`,
      cards: [],
      suggestions: ['General Physician'],
    };
  }

  doctors.forEach((d) => session.shown.set(d.id, d.name));
  return {
    reply:
      `For this, a ${lead} is usually the right kind of doctor to start with. Here are the best matches available on PhoenixCare, ranked on how well they fit, patient ratings, how soon they can see you, experience and reliability. ` +
      `Open “Why this doctor?” to see the details, then pick a time.`,
    cards: [{ type: 'doctors', need: { specialties, mode: null }, doctors }],
    suggestions: [],
  };
}
