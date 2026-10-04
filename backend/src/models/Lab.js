import mongoose from 'mongoose';

const { Schema } = mongoose;

export const LAB_TEST_CATEGORIES = [
  'blood',
  'diabetes',
  'thyroid',
  'heart',
  'liver',
  'kidney',
  'vitamins',
  'hormones',
  'infection',
  'imaging',
  'full_body',
  'other',
];

export const LAB_ACCREDITATIONS = ['NABL', 'CAP', 'ISO', 'NABH'];

const labTestSchema = new Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: LAB_TEST_CATEGORIES, default: 'other' },
  price: { type: Number, required: true, min: 0 },
  // Optional offer price shown with the original struck through.
  offerPrice: { type: Number, min: 0 },
  sampleType: { type: String, trim: true, default: '' },
  preparation: { type: String, trim: true, default: '' },
  reportHours: { type: Number, min: 0, default: 24 },
  homeCollection: { type: Boolean, default: true },
});

// A diagnostic lab onboarded by an admin. Only `status: 'active'` labs are shown to patients.
const labSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    accreditations: [{ type: String, enum: LAB_ACCREDITATIONS }],
    contactPerson: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    pincode: { type: String, trim: true, default: '' },
    operatingHours: { type: String, trim: true, default: '' },
    homeCollection: { type: Boolean, default: true },
    homeCollectionFee: { type: Number, min: 0, default: 0 },
    description: { type: String, trim: true, default: '' },
    tests: { type: [labTestSchema], default: [] },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

labSchema.index({ name: 'text', 'tests.name': 'text', city: 'text' });

export const Lab = mongoose.model('Lab', labSchema);
