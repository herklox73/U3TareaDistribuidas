const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { UnauthorizedError } = require('./error.middleware');
const emitter = require('../events/eventEmitter');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    emitter.emit('access.denied', { userEmail: null, reason: 'NO_AUTENTICADO', path: req.path });
    return next(new UnauthorizedError('Token requerido', 'NO_AUTENTICADO'));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      emitter.emit('access.denied', { userEmail: null, reason: 'TOKEN_EXPIRADO', path: req.path });
      return next(new UnauthorizedError('Token expirado', 'TOKEN_EXPIRADO'));
    }
    emitter.emit('access.denied', { userEmail: null, reason: 'TOKEN_INVALIDO', path: req.path });
    return next(new UnauthorizedError('Token invalido', 'TOKEN_INVALIDO'));
  }

  const revoked = await pool.query(
    'SELECT id FROM revoked_tokens WHERE jti = $1',
    [decoded.jti]
  );

  if (revoked.rows.length > 0) {
    emitter.emit('access.denied', { userEmail: decoded.email, reason: 'TOKEN_REVOCADO', path: req.path });
    return next(new UnauthorizedError('Token revocado. Inicia sesion nuevamente.', 'TOKEN_REVOCADO'));
  }

  req.user = decoded;
  next();
};

module.exports = authMiddleware;