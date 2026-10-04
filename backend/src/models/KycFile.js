import mongoose from 'mongoose';

const { Schema } = mongoose;

// The bytes of a doctor's verification document. Kept in its own collection (and excluded from
// queries by default) so identity documents are never returned by an ordinary doctor lookup,
// and are only ever served through the authenticated document endpoints.
const kycFileSchema = new Schema(
  {
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    docType: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true, select: false },
  },
  { timestamps: true }
);

export const KycFile = mongoose.model('KycFile', kycFileSchema);
