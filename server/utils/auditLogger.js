// ===== File: /utils/auditLogger.js =====
const AuditLog = require('../models/AuditLog');

const logAction = async (userId, action, entity, entityId = null, details = {}, ipAddress = null) => {
  try {
    const log = new AuditLog({
      user: userId,
      action,
      entity,
      entityId,
      details,
      ipAddress 
    });
    await log.save();
    // console.log('Audit log created:', action, entity, entityId); 
  } catch (error) {
    console.error('Failed to create audit log:', error.message, error.stack);
  }
};

module.exports = logAction;