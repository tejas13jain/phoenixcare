import mongoose from 'mongoose';

const { Schema } = mongoose;

export const ENQUIRY_STATUSES = ['new', 'contacted', 'scheduled', 'closed'];

// A callback request from the Surgery Care page. Anyone can submit one; `user` is set when
// the visitor was signed in. Admins work through them by moving `status` forward.
const surgeryEnquirySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    procedure: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, default: '' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ENQUIRY_STATUSES, default: 'new', index: true },
  },
  { timestamps: true }
);

export const SurgeryEnquiry = mongoose.model('SurgeryEnquiry', surgeryEnquirySchema);
