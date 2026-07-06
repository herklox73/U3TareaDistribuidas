const { EventEmitter } = require('events');

// Patron Observer: el emisor no conoce a sus suscriptores. Los servicios
// (compra, login, logout, acceso denegado) solo "anuncian" que algo ocurrio;
// quien reacciona (logs en archivo/consola, registro en system_logs, y a
// futuro notificaciones o metricas) se define en events/subscribers sin
// tocar la logica de negocio. Esto refuerza el principio Abierto/Cerrado.
class AppEventEmitter extends EventEmitter {}

module.exports = new AppEventEmitter();
