// Curated, rule-based workout suggestions (not a personal trainer substitute) — mirrors
// nutritionService.js's approach: a small hand-picked library filtered by goal/gym access,
// clearly framed as general guidance with a CTA toward a real consultation.

const WORKOUT_LIBRARY = {
  no_gym: [
    { day: 'Mon', focus: 'Full body (bodyweight)', exercises: ['Bodyweight squats 3x15', 'Push-ups 3x10', 'Plank 3x30s', 'Walking lunges 3x12'] },
    { day: 'Tue', focus: 'Cardio', exercises: ['Brisk walk / jog 25-30 min', 'Jumping jacks 3x1min'] },
    { day: 'Wed', focus: 'Rest or light stretching', exercises: ['Full body stretch 15 min', 'Deep breathing 5 min'] },
    { day: 'Thu', focus: 'Core & mobility', exercises: ['Crunches 3x15', 'Glute bridges 3x15', 'Bird-dog 3x10/side'] },
    { day: 'Fri', focus: 'Full body (bodyweight)', exercises: ['Squats 3x15', 'Incline push-ups 3x12', 'Superman hold 3x20s'] },
    { day: 'Sat', focus: 'Cardio + fun', exercises: ['Cycling / dancing / sport 30 min'] },
    { day: 'Sun', focus: 'Rest', exercises: ['Light walk 15-20 min', 'Stretching'] },
  ],
  gym_maintenance: [
    { day: 'Mon', focus: 'Upper body', exercises: ['Bench press 3x10', 'Lat pulldown 3x12', 'Shoulder press 3x10', 'Bicep curls 3x12'] },
    { day: 'Tue', focus: 'Lower body', exercises: ['Leg press 3x12', 'Leg curls 3x12', 'Calf raises 3x15'] },
    { day: 'Wed', focus: 'Cardio', exercises: ['Treadmill / cycling 25-30 min moderate pace'] },
    { day: 'Thu', focus: 'Upper body', exercises: ['Rows 3x12', 'Push-ups 3x12', 'Tricep pushdowns 3x12'] },
    { day: 'Fri', focus: 'Lower body + core', exercises: ['Squats 3x10', 'Deadlifts (light) 3x8', 'Plank 3x40s'] },
    { day: 'Sat', focus: 'Active recovery', exercises: ['Swimming / brisk walk 30 min', 'Stretching'] },
    { day: 'Sun', focus: 'Rest', exercises: ['Full rest'] },
  ],
  gym_muscle_gain: [
    { day: 'Mon', focus: 'Chest & triceps', exercises: ['Bench press 4x8', 'Incline dumbbell press 3x10', 'Dips 3x10', 'Tricep extensions 3x12'] },
    { day: 'Tue', focus: 'Back & biceps', exercises: ['Deadlifts 4x6', 'Pull-ups/lat pulldown 3x10', 'Barbell rows 3x10', 'Bicep curls 3x12'] },
    { day: 'Wed', focus: 'Legs', exercises: ['Squats 4x8', 'Leg press 3x12', 'Romanian deadlifts 3x10', 'Calf raises 4x15'] },
    { day: 'Thu', focus: 'Shoulders & core', exercises: ['Overhead press 4x8', 'Lateral raises 3x15', 'Face pulls 3x15', 'Hanging leg raises 3x12'] },
    { day: 'Fri', focus: 'Full body / weak points', exercises: ['Compound lift of choice 3x8', 'Accessory work 3x12'] },
    { day: 'Sat', focus: 'Light cardio + mobility', exercises: ['Incline walk 20 min', 'Mobility drills 10 min'] },
    { day: 'Sun', focus: 'Rest', exercises: ['Full rest — prioritize protein & sleep'] },
  ],
  gym_weight_loss: [
    { day: 'Mon', focus: 'Full body strength', exercises: ['Squats 3x12', 'Push-ups 3x12', 'Rows 3x12', 'Plank 3x30s'] },
    { day: 'Tue', focus: 'HIIT cardio', exercises: ['20 min intervals: 1 min hard / 1 min easy'] },
    { day: 'Wed', focus: 'Full body strength', exercises: ['Lunges 3x12', 'Shoulder press 3x12', 'Deadlifts (light) 3x10'] },
    { day: 'Thu', focus: 'Steady cardio', exercises: ['Cycling / brisk walk 35-40 min'] },
    { day: 'Fri', focus: 'Full body strength', exercises: ['Goblet squats 3x12', 'Push-ups 3x12', 'Plank 3x40s'] },
    { day: 'Sat', focus: 'Active recovery', exercises: ['Swimming / sport / long walk 30-40 min'] },
    { day: 'Sun', focus: 'Rest', exercises: ['Full rest, light stretching'] },
  ],
};

export function getWorkoutSuggestions({ fitnessGoal = 'maintenance', goesToGym = false }) {
  let key = 'no_gym';
  if (goesToGym) {
    if (fitnessGoal === 'muscle_gain') key = 'gym_muscle_gain';
    else if (fitnessGoal === 'weight_loss') key = 'gym_weight_loss';
    else key = 'gym_maintenance';
  }

  return {
    planKey: key,
    weeklyPlan: WORKOUT_LIBRARY[key],
    disclaimer:
      'A general weekly template, not a personalized program — ease in gradually and stop if anything causes pain. For a plan tailored to any existing conditions, consult a doctor or physiotherapist first.',
  };
}
