import mongoose from 'mongoose';

const { Schema } = mongoose;

const doctorSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialties: [{ type: String, required: true, index: true }],
    registrationNumber: { type: String, required: true, unique: true, trim: true },
    registrationCouncil: { type: String, trim: true },
    qualifications: [{ type: String }],
    experienceYears: { type: Number, default: 0, min: 0 },
    bio: { type: String, default: '' },
    languages: [{ type: String }],
    consultationModes: [
      { type: String, enum: ['video', 'audio', 'chat', 'in_clinic'], default: ['video'] },
    ],
    fee: {
      video: { type: Number, default: 0 },
      audio: { type: Number, default: 0 },
      chat: { type: Number, default: 0 },
      in_clinic: { type: Number, default: 0 },
    },
    clinicAddress: { type: String, default: '' },
    city: { type: String, index: true },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    totalConsultations: { type: Number, default: 0 },
    kycStatus: {
      type: String,
      enum: ['pending', 'under_review', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    // One entry per document type (see constants/kycDocuments.js). The file bytes live in the
    // KycFile collection and are only served through authenticated endpoints.
    kycDocuments: [
      {
        docType: { type: String, required: true },
        originalName: { type: String },
        mimeType: { type: String },
        size: { type: Number },
        file: { type: Schema.Types.ObjectId, ref: 'KycFile' },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        rejectionReason: { type: String },
        uploadedAt: { type: Date, default: Date.now },
        reviewedAt: { type: Date },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    kycRejectionReason: { type: String },
    // Latest Doctor Terms & Conditions the doctor accepted (see constants/doctorTerms.js).
    // Doctors must re-accept when TERMS_VERSION changes.
    termsAcceptance: {
      version: { type: String },
      acceptedAt: { type: Date },
      ip: { type: String },
      userAgent: { type: String },
    },
    // Set once the "standards you agree to follow" email has gone out, so it is sent once.
    standardsEmailSentAt: { type: Date },
    isAcceptingNewPatients: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    payoutDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifsc: String,
      upiId: String,
    },
  },
  { timestamps: true }
);

doctorSchema.index({ specialties: 1, city: 1, rating: -1 });
doctorSchema.index({ bio: 'text', qualifications: 'text' });

export const Doctor = mongoose.model('Doctor', doctorSchema);
