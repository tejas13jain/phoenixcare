import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { HealthTip } from '../src/models/HealthTip.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/phoenixcare';

const tips = [
  {
    category: 'hydration',
    icon: 'droplet',
    title: 'Drink up',
    body: 'Aim for 8 glasses of water today — proper hydration supports energy, focus, and healthy skin.',
  },
  {
    category: 'hydration',
    icon: 'droplet',
    title: 'Morning glass',
    body: 'Start your day with a glass of water before coffee or tea — it kickstarts your metabolism after hours of sleep.',
  },
  {
    category: 'movement',
    icon: 'footprints',
    title: 'Take the stairs',
    body: 'Small bursts of movement add up. Try taking the stairs or a 10-minute walk after meals today.',
  },
  {
    category: 'movement',
    icon: 'footprints',
    title: 'Stretch break',
    body: "Sitting for long hours? Stand up and stretch for 2 minutes every hour — your back and shoulders will thank you.",
  },
  {
    category: 'sleep',
    icon: 'moon',
    title: 'Consistent sleep',
    body: 'Try to sleep and wake at the same time every day, even on weekends — it strengthens your body clock.',
  },
  {
    category: 'sleep',
    icon: 'moon',
    title: 'Wind down screen-free',
    body: 'Avoid screens 30 minutes before bed. Blue light can delay melatonin release and affect sleep quality.',
  },
  {
    category: 'nutrition',
    icon: 'apple',
    title: 'Colorful plate',
    body: 'Try to fill half your plate with vegetables and fruits today — more color usually means more nutrients.',
  },
  {
    category: 'nutrition',
    icon: 'apple',
    title: 'Mindful snacking',
    body: 'Reach for nuts, fruit, or yogurt instead of processed snacks when hunger strikes between meals.',
  },
  {
    category: 'mental_health',
    icon: 'brain',
    title: 'Take a breath',
    body: 'Try 4-7-8 breathing: inhale for 4 seconds, hold for 7, exhale for 8. Repeat 3 times to reset your nervous system.',
  },
  {
    category: 'mental_health',
    icon: 'brain',
    title: 'Digital sunset',
    body: 'Set a time each evening to put your phone away — a short offline window can meaningfully reduce stress.',
  },
  {
    category: 'preventive_care',
    icon: 'stethoscope',
    title: 'Know your numbers',
    body: 'Regular check-ups catch issues early. If it has been a while, consider booking a general health check-up.',
  },
  {
    category: 'preventive_care',
    icon: 'stethoscope',
    title: 'Skin check',
    body: 'Take a moment to check your skin for any new or changing moles — early detection makes a big difference.',
  },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to ${MONGODB_URI}`);

  await HealthTip.deleteMany({});
  await HealthTip.insertMany(tips);

  console.log(`Seeded ${tips.length} health tips.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
