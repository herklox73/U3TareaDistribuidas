const pool = require('../config/db');
const logger = require('../config/logger');

const saveLog = async ({ event_type, user_email, description, ip_address }) => {
  try {
    await pool.query(
      `INSERT INTO system_logs (event_type, user_email, description, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [event_type, user_email || null, description, ip_address || null]
    );
  } catch (err) {
    logger.error('Error guardando log en DB', { error: err.message });
  }
};

const requestLogger = (req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    user: req.user?.email,
  });
  next();
};

module.exports = { saveLog, requestLogger };