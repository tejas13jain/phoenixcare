import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../src/models/User.js';
import { Doctor } from '../src/models/Doctor.js';
import { Patient } from '../src/models/Patient.js';
import { Slot } from '../src/models/Slot.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/phoenixcare';
const DEMO_PASSWORD = 'Phoenix@123';

const doctorSeeds = [
  {
    name: 'Dr. Ananya Rao',
    specialties: ['General Physician'],
    city: 'Bengaluru',
    experienceYears: 9,
    languages: ['English', 'Hindi', 'Kannada'],
    fee: { video: 499, audio: 349, chat: 249, in_clinic: 599 },
    bio: 'General physician focused on preventive care, chronic disease management, and everyday illnesses.',
    isFeatured: true,
  },
  {
    name: 'Dr. Rohan Mehta',
    specialties: ['Dermatologist'],
    city: 'Mumbai',
    experienceYears: 12,
    languages: ['English', 'Hindi', 'Marathi'],
    fee: { video: 699, audio: 499, chat: 349, in_clinic: 899 },
    bio: 'Dermatologist specializing in acne, pigmentation, hair loss, and cosmetic dermatology.',
    isFeatured: true,
  },
  {
    name: 'Dr. Priya Nair',
    specialties: ['Pediatrician'],
    city: 'Kochi',
    experienceYears: 15,
    languages: ['English', 'Malayalam', 'Hindi'],
    fee: { video: 599, audio: 399, chat: 299, in_clinic: 699 },
    bio: 'Pediatrician with 15 years of experience in newborn care, vaccinations, and child nutrition.',
    isFeatured: true,
  },
  {
    name: 'Dr. Kavita Sharma',
    specialties: ['Gynecologist'],
    city: 'Delhi',
    experienceYears: 11,
    languages: ['English', 'Hindi'],
    fee: { video: 799, audio: 549, chat: 399, in_clinic: 999 },
    bio: "Gynecologist and obstetrician specializing in women's reproductive and prenatal health.",
    isFeatured: false,
  },
  {
    name: 'Dr. Arjun Verma',
    specialties: ['Psychiatrist'],
    city: 'Pune',
    experienceYears: 8,
    languages: ['English', 'Hindi'],
    fee: { video: 899, audio: 649, chat: 449, in_clinic: 1099 },
    bio: 'Psychiatrist helping with anxiety, depression, stress management, and sleep disorders.',
    isFeatured: false,
  },
  {
    name: 'Dr. Sameer Khan',
    specialties: ['Cardiologist'],
    city: 'Hyderabad',
    experienceYears: 18,
    languages: ['English', 'Hindi', 'Urdu'],
    fee: { video: 999, audio: 749, chat: 549, in_clinic: 1299 },
    bio: 'Senior cardiologist specializing in hypertension, heart disease risk assessment, and post-cardiac care.',
    isFeatured: true,
  },
  {
    name: 'Dr. Neha Kulkarni',
    specialties: ['Dentist'],
    city: 'Pune',
    experienceYears: 6,
    languages: ['English', 'Hindi', 'Marathi'],
    fee: { video: 349, audio: 249, chat: 199, in_clinic: 499 },
    bio: 'Dentist offering consultations on oral hygiene, cavities, and orthodontic guidance.',
    isFeatured: false,
  },
  {
    name: 'Dr. Meera Iyer',
    specialties: ['Nutritionist'],
    city: 'Chennai',
    experienceYears: 7,
    languages: ['English', 'Tamil'],
    fee: { video: 449, audio: 329, chat: 249, in_clinic: 549 },
    bio: 'Clinical nutritionist specializing in weight management, diabetes-friendly diets, and sports nutrition.',
    isFeatured: false,
  },
];

function nextNDates(n) {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= n; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function generateSlotDocs(doctorId, dates, modes) {
  const docs = [];
  for (const date of dates) {
    let hour = 9;
    let minute = 0;
    while (hour < 17) {
      const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      minute += 30;
      if (minute >= 60) {
        minute = 0;
        hour += 1;
      }
      const endTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      docs.push({ doctor: doctorId, date, startTime, endTime, modes, status: 'available' });
    }
  }
  return docs;
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to ${MONGODB_URI}`);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // Admin
  await User.findOneAndUpdate(
    { email: 'admin@phoenixcare.demo' },
    {
      name: 'PhoenixCare Admin',
      email: 'admin@phoenixcare.demo',
      phone: '+919000000001',
      passwordHash,
      role: 'admin',
      isEmailVerified: true,
      isPhoneVerified: true,
    },
    { upsert: true, new: true }
  );

  // Demo patient
  const patientUser = await User.findOneAndUpdate(
    { email: 'patient@phoenixcare.demo' },
    {
      name: 'Rahul Singh',
      email: 'patient@phoenixcare.demo',
      phone: '+919000000002',
      passwordHash,
      role: 'patient',
      isEmailVerified: true,
      isPhoneVerified: true,
    },
    { upsert: true, new: true }
  );
  await Patient.findOneAndUpdate({ user: patientUser._id }, { user: patientUser._id }, { upsert: true });

  const dates = nextNDates(7);
  let seeded = 0;

  for (const [index, seed] of doctorSeeds.entries()) {
    const email = `doctor${index + 1}@phoenixcare.demo`;
    const phone = `+9190000010${String(index + 1).padStart(2, '0')}`;

    const user = await User.findOneAndUpdate(
      { email },
      {
        name: seed.name,
        email,
        phone,
        passwordHash,
        role: 'doctor',
        isEmailVerified: true,
        isPhoneVerified: true,
      },
      { upsert: true, new: true }
    );

    const modes = ['video', 'audio', 'chat'];
    const doctor = await Doctor.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        specialties: seed.specialties,
        registrationNumber: `MCI-DEMO-${1000 + index}`,
        registrationCouncil: 'Medical Council of India',
        qualifications: ['MBBS', `MD (${seed.specialties[0]})`],
        experienceYears: seed.experienceYears,
        bio: seed.bio,
        languages: seed.languages,
        consultationModes: modes,
        fee: seed.fee,
        city: seed.city,
        clinicAddress: `${seed.city} PhoenixCare Partner Clinic`,
        kycStatus: 'verified',
        isFeatured: seed.isFeatured,
        rating: 4.2 + Math.random() * 0.7,
        ratingCount: 20 + Math.floor(Math.random() * 150),
      },
      { upsert: true, new: true }
    );

    await Slot.deleteMany({ doctor: doctor._id, date: { $in: dates } });
    const slotDocs = generateSlotDocs(doctor._id, dates, modes);
    await Slot.insertMany(slotDocs);

    seeded += 1;
  }

  console.log(`Seeded ${seeded} doctors with 7 days of availability.`);
  console.log('Demo login for any account: password "Phoenix@123"');
  console.log('  Admin:   admin@phoenixcare.demo');
  console.log('  Patient: patient@phoenixcare.demo');
  console.log('  Doctors: doctor1@phoenixcare.demo .. doctor8@phoenixcare.demo');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
