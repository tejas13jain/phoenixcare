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
    height: { type: Number },
    weight: { type: Number },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    address: { type: String, default: '' },
    city: { type: String },
    familyMembers: [familyMemberSchema],
  },
  { timestamps: true }
);

export const Patient = mongoose.model('Patient', patientSchema);
