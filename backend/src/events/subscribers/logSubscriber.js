const emitter = require('../eventEmitter');
const logger = require('../../config/logger');
const { saveLog } = require('../../middlewares/log.middleware');

// Suscriptor unico de logging: escucha los eventos de negocio y decide como
// registrarlos (linea de log UTC + fila en system_logs). Si en el futuro se
// agregan mas suscriptores (correo, metricas), no hace falta tocar los
// servicios que emiten los eventos.

emitter.on('user.loggedIn', ({ userEmail, jti }) => {
  logger.info('LOGIN', { user: userEmail, jti });
  saveLog({ event_type: 'LOGIN', user_email: userEmail, description: 'Inicio de sesion Google OAuth' });
});

emitter.on('user.loginFailed', ({ reason }) => {
  logger.warn('LOGIN_FAILED', { reason });
  saveLog({ event_type: 'LOGIN_FAILED', description: `Intento de login fallido: ${reason}` });
});

emitter.on('user.loggedOut', ({ userEmail, jti }) => {
  logger.info('LOGOUT', { user: userEmail, jti });
  saveLog({ event_type: 'LOGOUT', user_email: userEmail, description: 'Cierre de sesion - token revocado' });
});

emitter.on('token.revoked', ({ userEmail, jti }) => {
  logger.info('TOKEN_REVOKED', { user: userEmail, jti });
  saveLog({ event_type: 'TOKEN_REVOKED', user_email: userEmail, description: `Token revocado jti=${jti}` });
});

emitter.on('access.denied', ({ userEmail, reason, path }) => {
  const eventType = reason === 'ROL_NO_AUTORIZADO' ? 'ACCESS_DENIED_ROLE' : 'ACCESS_DENIED_NO_AUTH';
  logger.warn(eventType, { user: userEmail || 'anonimo', reason, path });
  saveLog({
    event_type: eventType,
    user_email: userEmail,
    description: `Acceso denegado en ${path} (${reason})`,
  });
});

emitter.on('order.created', ({ userEmail, orderId, total }) => {
  logger.info('PURCHASE_CREATED', { user: userEmail, order: orderId, total });
  saveLog({
    event_type: 'PURCHASE_CREATED',
    user_email: userEmail,
    description: `Compra: orden ${orderId} - total $${total}`,
  });
});

emitter.on('product.created', ({ userEmail, productName }) => {
  logger.info('PRODUCT_CREATE', { user: userEmail, product: productName });
  saveLog({ event_type: 'PRODUCT_CREATE', user_email: userEmail, description: `Producto creado: ${productName}` });
});

emitter.on('product.updated', ({ userEmail, productId }) => {
  logger.info('PRODUCT_UPDATE', { user: userEmail, product: productId });
  saveLog({ event_type: 'PRODUCT_UPDATE', user_email: userEmail, description: `Producto actualizado: ID ${productId}` });
});

emitter.on('product.deleted', ({ userEmail, productId }) => {
  logger.info('PRODUCT_DELETE', { user: userEmail, product: productId });
  saveLog({ event_type: 'PRODUCT_DELETE', user_email: userEmail, description: `Producto desactivado: ID ${productId}` });
});

emitter.on('product.reactivated', ({ userEmail, productId }) => {
  logger.info('PRODUCT_REACTIVATED', { user: userEmail, product: productId });
  saveLog({ event_type: 'PRODUCT_REACTIVATED', user_email: userEmail, description: `Producto reactivado: ID ${productId}` });
});

emitter.on('stock.updated', ({ userEmail, productId, delta }) => {
  logger.info('STOCK_UPDATED', { user: userEmail, product: productId, delta });
  saveLog({
    event_type: 'STOCK_UPDATED',
    user_email: userEmail,
    description: `Stock producto ${productId} ajustado en ${delta}`,
  });
});

emitter.on('db.error', ({ context, message }) => {
  logger.error('DB_ERROR', { context, message });
});

module.exports = emitter;
