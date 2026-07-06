const { UnauthorizedError, ForbiddenError } = require('./error.middleware');
const emitter = require('../events/eventEmitter');

// Middleware de autorizacion por rol. Se coloca despues de authMiddleware
// (que ya valida token/firma/expiracion/revocacion) y antes del controlador
// de cada ruta restringida. El rol viene del JWT, que a su vez viene de la
// base de datos: nunca se confia en un rol enviado por el cliente.
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError('No autenticado'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    emitter.emit('access.denied', {
      userEmail: req.user.email,
      reason: 'ROL_NO_AUTORIZADO',
      path: req.path,
    });
    return next(new ForbiddenError('Rol no autorizado para este recurso'));
  }

  next();
};

module.exports = { requireRole };
