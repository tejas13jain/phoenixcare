// Plain-language symptom/condition keywords mapped to the medical specialty that treats them.
// Lets patients search "chest pain" or "skin rash" instead of already knowing they need a
// Cardiologist or Dermatologist.
export const SPECIALTY_KEYWORDS = {
  'General Physician': [
    'fever', 'cold', 'cough', 'flu', 'body pain', 'weakness', 'checkup', 'general checkup', 'viral',
  ],
  Pediatrician: ['child', 'children', 'baby', 'infant', 'kid', 'kids', 'vaccination', 'newborn'],
  Cardiologist: [
    'heart', 'chest pain', 'blood pressure', 'bp', 'palpitation', 'cholesterol', 'cardiac',
  ],
  Psychiatrist: [
    'stress', 'anxiety', 'depression', 'mental health', 'sleep problem', 'insomnia', 'panic', 'mood',
  ],
  Dentist: ['teeth', 'tooth', 'toothache', 'gum', 'gums', 'cavity', 'dental'],
  Nutritionist: ['diet', 'weight loss', 'nutrition', 'obesity', 'protein', 'weight gain'],
  Dermatologist: ['skin', 'acne', 'hair fall', 'rash', 'pimple', 'allergy', 'hair loss'],
  Gynecologist: ['pregnancy', 'periods', 'women health', 'pcod', 'pcos', 'menstrual', 'fertility'],
};

// Given free-text search input, return the list of specialty names whose keywords appear in it.
export function matchSpecialtiesFromKeywords(text) {
  const lower = text.toLowerCase();
  return Object.entries(SPECIALTY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((k) => lower.includes(k)))
    .map(([specialty]) => specialty);
}
