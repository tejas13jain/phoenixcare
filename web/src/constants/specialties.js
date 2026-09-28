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
    keywords: ['fever', 'cold', 'cough', 'body pain', 'checkup'],
  },
  {
    name: 'Pediatrician',
    i18nKey: 'pediatrician',
    icon: Baby,
    keywords: ['child', 'baby', 'infant', 'vaccination'],
  },
  {
    name: 'Cardiologist',
    i18nKey: 'cardiologist',
    icon: HeartPulse,
    keywords: ['heart', 'chest pain', 'blood pressure', 'palpitation'],
  },
  {
    name: 'Psychiatrist',
    i18nKey: 'psychiatrist',
    icon: Brain,
    keywords: ['stress', 'anxiety', 'depression', 'sleep problem'],
  },
  {
    name: 'Dentist',
    i18nKey: 'dentist',
    icon: Smile,
    keywords: ['teeth', 'toothache', 'gum', 'cavity'],
  },
  {
    name: 'Nutritionist',
    i18nKey: 'nutritionist',
    icon: Salad,
    keywords: ['diet', 'weight loss', 'nutrition', 'obesity'],
  },
  {
    name: 'Dermatologist',
    i18nKey: 'dermatologist',
    icon: Sparkles,
    keywords: ['skin', 'acne', 'hair fall', 'rash'],
  },
  {
    name: 'Gynecologist',
    i18nKey: 'gynecologist',
    icon: Heart,
    keywords: ['pregnancy', 'periods', 'women health', 'pcod'],
  },
];

const BY_NAME = new Map(SPECIALTIES.map((s) => [s.name, s]));

export function getSpecialtyInfo(name) {
  return BY_NAME.get(name);
}
