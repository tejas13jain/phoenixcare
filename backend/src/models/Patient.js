import mongoose from 'mongoose';

const { Schema } = mongoose;

const familyMemberSchema = new Schema(
  {
    name: { type: String, required: true },
    relation: { type: String, required: true },
    dob: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: { type: String },
  },
  { timestamps: true }
);

const patientSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dob: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: { type: String },
    height: { type: Number }, // cm
    weight: { type: Number }, // kg
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    address: { type: String, default: '' },
    city: { type: String },
    familyMembers: [familyMemberSchema],

    fitnessGoal: { type: String, enum: ['weight_loss', 'muscle_gain', 'maintenance'], default: 'maintenance' },
    goesToGym: { type: Boolean, default: false },

    gamification: {
      totalXp: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastActivityDate: { type: String, default: null }, // YYYY-MM-DD
    },
  },
  { timestamps: true }
);

export const Patient = mongoose.model('Patient', patientSchema);
