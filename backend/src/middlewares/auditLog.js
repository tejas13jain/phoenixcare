import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../config/logger.js';

// Attach to routes that expose sensitive patient data (health records, prescriptions).
// Fire-and-forget: audit logging must never block or fail the actual request.
export const auditLog = (action, resourceType) => (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400) return;
    AuditLog.create({
      actor: req.user?._id,
      actorRole: req.user?.role,
      action,
      resourceType,
      resourceId: req.params.id || req.params.patientId || req.user?._id,
      patientId: req.auditPatientId || undefined,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch((err) => logger.error(`Audit log write failed: ${err.message}`));
  });
  next();
};
