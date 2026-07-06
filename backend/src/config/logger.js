const { createLogger, format, transports } = require('winston');
const path = require('path');

// Formato de linea exacto exigido por el enunciado (seccion 15), por ejemplo:
// 2026-07-01T15:30:00Z INFO PURCHASE_CREATED user=25 order=103
const lineFormat = format.printf(({ timestamp, level, message, ...meta }) => {
  const metaStr = Object.entries(meta)
    .filter(([key]) => key !== 'stack')
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');
  return `${timestamp} ${level.toUpperCase()} ${message}${metaStr ? ' ' + metaStr : ''}`;
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(), // ISO 8601 en UTC con sufijo 'Z' (comportamiento por defecto de winston)
    format.errors({ stack: true }),
    lineFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: path.join(__dirname, '../../logs/app.log'),
    }),
    new transports.File({
      filename: path.join(__dirname, '../../logs/errors.log'),
      level: 'error',
    }),
  ],
});

module.exports = logger;
