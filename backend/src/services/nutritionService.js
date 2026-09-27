// Rule-of-thumb estimates (not clinical/medical advice) — the UI should always frame these as
// general wellness guidance and point users toward a real nutritionist consultation for anything
// more precise, which is what the `ctaHint` field is for.

const FOOD_LIBRARY = [
  { name: 'Grilled chicken breast (100g)', proteinG: 31, calories: 165, tags: ['high_protein', 'gym', 'non_veg'] },
  { name: 'Paneer (100g)', proteinG: 18, calories: 265, tags: ['high_protein', 'gym', 'veg'] },
  { name: 'Greek yogurt (200g)', proteinG: 20, calories: 146, tags: ['high_protein', 'veg', 'snack'] },
  { name: 'Boiled eggs (2 whole)', proteinG: 13, calories: 155, tags: ['high_protein', 'gym', 'non_veg'] },
  { name: 'Moong dal (1 cup cooked)', proteinG: 14, calories: 212, tags: ['veg', 'high_protein'] },
  { name: 'Rajma / kidney beans (1 cup cooked)', proteinG: 15, calories: 225, tags: ['veg', 'high_protein'] },
  { name: 'Almonds (30g)', proteinG: 6, calories: 174, tags: ['snack', 'veg'] },
  { name: 'Peanut butter (2 tbsp)', proteinG: 8, calories: 190, tags: ['snack', 'veg', 'gym'] },
  { name: 'Soya chunks (50g dry)', proteinG: 26, calories: 172, tags: ['veg', 'high_protein', 'gym'] },
  { name: 'Whey protein shake (1 scoop)', proteinG: 24, calories: 120, tags: ['gym', 'high_protein', 'supplement'] },
  { name: 'Oats (1 cup cooked)', proteinG: 6, calories: 158, tags: ['veg', 'breakfast'] },
  { name: 'Sprouts salad (1 cup)', proteinG: 7, calories: 90, tags: ['veg', 'weight_loss'] },
  { name: 'Grilled fish (100g)', proteinG: 22, calories: 140, tags: ['non_veg', 'high_protein', 'gym'] },
  { name: 'Cottage cheese / tofu (100g)', proteinG: 8, calories: 76, tags: ['veg', 'weight_loss'] },
];

function proteinPerKg({ goesToGym, fitnessGoal }) {
  if (!goesToGym) return 1.2;
  if (fitnessGoal === 'muscle_gain') return 2.2;
  if (fitnessGoal === 'weight_loss') return 1.8;
  return 1.6;
}

function caloriesPerKg({ goesToGym, fitnessGoal }) {
  if (fitnessGoal === 'weight_loss') return goesToGym ? 26 : 24;
  if (fitnessGoal === 'muscle_gain') return goesToGym ? 36 : 30;
  return goesToGym ? 30 : 26;
}

export function getNutritionSuggestions({ weight, fitnessGoal = 'maintenance', goesToGym = false }) {
  if (!weight || weight <= 0) {
    return { needsWeight: true };
  }

  const proteinTargetG = Math.round(weight * proteinPerKg({ goesToGym, fitnessGoal }));
  const calorieTarget = Math.round(weight * caloriesPerKg({ goesToGym, fitnessGoal }));

  const relevantTags = goesToGym ? ['high_protein', 'gym'] : fitnessGoal === 'weight_loss' ? ['weight_loss', 'veg'] : ['veg', 'high_protein'];

  const foods = FOOD_LIBRARY.filter((f) => f.tags.some((t) => relevantTags.includes(t)))
    .sort((a, b) => b.proteinG - a.proteinG)
    .slice(0, 6);

  return {
    needsWeight: false,
    calorieTarget,
    proteinTargetG,
    foods,
    disclaimer: 'These are general wellness estimates, not medical advice — for a plan tailored to you, book a consultation with a nutritionist.',
  };
}
