const AuditLog = require('../models/AuditLog.model');

class AuditLogRepository {
  async log({ actor, action, targetType, targetId, metadata, ipAddress }) {
    return AuditLog.create({
      actor,
      action,
      targetType,
      targetId,
      metadata,
      ipAddress,
    });
  }
}

module.exports = AuditLogRepository;
