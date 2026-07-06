const pool = require('../config/db');

// GET /logs?limit=100  (solo admin)
const getLogs = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const { rows } = await pool.query(
    `SELECT id, event_type, user_email, description, ip_address, created_at
     FROM system_logs
     ORDER BY created_at DESC, id DESC
     LIMIT $1`,
    [limit]
  );
  res.json(rows);
};

module.exports = { getLogs };
