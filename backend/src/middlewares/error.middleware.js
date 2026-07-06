const logger = require('../config/logger');

class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message, errorCode = 'CAMPOS_INVALIDOS') {
    super(message, 400, errorCode);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404, 'RECURSO_NO_ENCONTRADO');
  }
}

class StockError extends AppError {
  constructor(available) {
    super('La cantidad solicitada supera el stock disponible.', 409, 'STOCK_INSUFICIENTE');
    this.available = available;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado', errorCode = 'NO_AUTENTICADO') {
    super(message, 401, errorCode);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Rol no autorizado') {
    super(message, 403, 'ROL_NO_AUTORIZADO');
  }
}

// Codigo de error por defecto cuando la excepcion no trae uno propio
// (por ejemplo errores no operacionales que no pasaron por una clase AppError).
const defaultCodeFor = (statusCode) => {
  switch (statusCode) {
    case 400: return 'CAMPOS_INVALIDOS';
    case 401: return 'NO_AUTENTICADO';
    case 403: return 'ROL_NO_AUTORIZADO';
    case 404: return 'RECURSO_NO_ENCONTRADO';
    case 409: return 'STOCK_INSUFICIENTE';
    default:  return 'ERROR_INTERNO';
  }
};

// Formato de respuesta exacto exigido por el enunciado (seccion 14):
// { timestamp, status, error, message, path }
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = !!err.isOperational;

  // Los errores no operacionales (bugs, fallos de conexion a BD, etc.) nunca
  // exponen su mensaje real al cliente: solo se registran en el log.
  let errorCode = err.errorCode;
  let message = err.message;

  if (!isOperational) {
    errorCode = err.code ? 'ERROR_BASE_DATOS' : 'ERROR_INTERNO';
    message = 'Error interno del servidor';
  } else if (!errorCode) {
    errorCode = defaultCodeFor(statusCode);
  }

  logger.error(isOperational ? 'ERROR_HANDLED' : 'INTERNAL_ERROR', {
    errorCode,
    status: statusCode,
    path: req.path,
    user: req.user?.email || 'anonimo',
    detail: isOperational ? err.message : err.message,
  });

  res.status(statusCode).json({
    timestamp: new Date().toISOString(),
    status: statusCode,
    error: errorCode,
    message,
    path: req.originalUrl,
  });
};

module.exports = {
  errorHandler,
  AppError,
  NotFoundError,
  ValidationError,
  StockError,
  UnauthorizedError,
  ForbiddenError,
};
