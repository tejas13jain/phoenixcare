import { Stethoscope, Baby, HeartPulse, Brain, Smile, Salad, Sparkles, Heart } from 'lucide-react';

// Maps the backend's medical specialty names to a plain-language tagline (translated per
// locale via i18n key), an icon, and the everyday symptom words a patient might search
// instead of already knowing the medical term. Keep in sync with
// backend/src/constants/specialtyKeywords.js.
export const SPECIALTIES = [
  {
    name: 'General Physician',
    i18nKey: 'general_physician',
    icon: Stethoscope,
    keywords: [
      'fever', 'cold', 'cough', 'flu', 'body pain', 'weakness', 'checkup', 'general checkup', 'viral',
      'headache',
    ],
  },
  {
    name: 'Pediatrician',
    i18nKey: 'pediatrician',
    icon: Baby,
    keywords: ['child', 'children', 'baby', 'infant', 'kid', 'kids', 'vaccination', 'newborn'],
  },
  {
    name: 'Cardiologist',
    i18nKey: 'cardiologist',
    icon: HeartPulse,
    keywords: ['heart', 'chest pain', 'blood pressure', 'bp', 'palpitation', 'cholesterol', 'cardiac'],
  },
  {
    name: 'Psychiatrist',
    i18nKey: 'psychiatrist',
    icon: Brain,
    keywords: [
      'stress', 'anxiety', 'depression', 'mental health', 'sleep problem', 'insomnia', 'panic', 'mood',
    ],
  },
  {
    name: 'Dentist',
    i18nKey: 'dentist',
    icon: Smile,
    keywords: ['teeth', 'tooth', 'toothache', 'gum', 'gums', 'cavity', 'dental'],
  },
  {
    name: 'Nutritionist',
    i18nKey: 'nutritionist',
    icon: Salad,
    keywords: ['diet', 'weight loss', 'nutrition', 'obesity', 'protein', 'weight gain'],
  },
  {
    name: 'Dermatologist',
    i18nKey: 'dermatologist',
    icon: Sparkles,
    keywords: ['skin', 'acne', 'hair fall', 'rash', 'pimple', 'allergy', 'hair loss'],
  },
  {
    name: 'Gynecologist',
    i18nKey: 'gynecologist',
    icon: Heart,
    keywords: ['pregnancy', 'periods', 'women health', 'pcod', 'pcos', 'menstrual', 'fertility'],
  },
];

const BY_NAME = new Map(SPECIALTIES.map((s) => [s.name, s]));

export function getSpecialtyInfo(name) {
  return BY_NAME.get(name);
}

// Ranks specialties by how many of their keywords appear in free text, so CareMatch can
// suggest a specialist from a plain-language description like "fever and headache".
// Short keywords ("bp") are matched as whole words to avoid hits inside other words.
export function matchSpecialties(text) {
  const lower = text.toLowerCase();
  return SPECIALTIES.map((s) => ({
    specialty: s,
    score: s.keywords.filter((k) =>
      k.length <= 3 ? new RegExp(`\\b${k}\\b`).test(lower) : lower.includes(k)
    ).length,
  }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((m) => m.specialty);
}
