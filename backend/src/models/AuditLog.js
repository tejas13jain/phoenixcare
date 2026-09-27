import mongoose from 'mongoose';

const { Schema } = mongoose;

// Compliance trail: records who accessed/modified patient-sensitive resources and when.
const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true }, // e.g. 'view_health_record', 'view_prescription'
    resourceType: { type: String, required: true },
    resourceId: { type: Schema.Types.ObjectId, required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ patientId: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
