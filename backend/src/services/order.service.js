const pool = require('../config/db');
const productRepo = require('../repositories/product.repository');
const orderRepo = require('../repositories/order.repository');
const { ValidationError, StockError, NotFoundError, ForbiddenError } = require('../middlewares/error.middleware');
const emitter = require('../events/eventEmitter');

// Compra transaccional con soporte para uno o varios productos por orden.
// El precio y el stock SIEMPRE se releen desde la base de datos: nunca se
// confia en lo que envie el cliente mas alla de product_id y quantity.
const createOrder = async (userEmail, items) => {
  if (!items || items.length === 0) {
    throw new ValidationError('La compra debe incluir al menos un producto', 'CAMPOS_INVALIDOS');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query('SELECT user_id FROM users WHERE email = $1', [userEmail]);
    const userId = userResult.rows[0]?.user_id;
    if (!userId) throw new NotFoundError('Usuario');

    let total = 0;
    const detailRows = [];

    for (const item of items) {
      const { product_id, quantity } = item;

      if (!product_id) throw new ValidationError('product_id es requerido', 'CAMPOS_INVALIDOS');
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new ValidationError('La cantidad debe ser un entero mayor a 0', 'CANTIDAD_INVALIDA');
      }

      const product = await productRepo.findByIdForUpdate(product_id, client);
      if (!product) throw new NotFoundError('Producto');
      if (product.discontinued === 1 || product.discontinued === true) {
        throw new ValidationError('Producto descontinuado', 'PRODUCTO_DESCONTINUADO');
      }
      if (product.units_in_stock < quantity) throw new StockError(product.units_in_stock);

      const unitPrice = Number(product.unit_price);
      const subtotal = Math.round(unitPrice * quantity * 100) / 100;
      total += subtotal;

      detailRows.push({
        product_id: product.product_id,
        product_name: product.product_name,
        quantity,
        unit_price: unitPrice,
        subtotal,
      });
    }

    const order = await orderRepo.createHeader(userId, total, client);

    for (const row of detailRows) {
      await orderRepo.addDetail(order.order_id, row, client);
    }

    await productRepo.decreaseStockBulk(detailRows, client);

    await client.query('COMMIT');

    emitter.emit('order.created', { userEmail, orderId: order.order_id, total });

    return { order, details: detailRows };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getMyOrders = async (userEmail) => {
  const userResult = await pool.query('SELECT user_id FROM users WHERE email = $1', [userEmail]);
  const userId = userResult.rows[0]?.user_id;
  if (!userId) return [];
  return orderRepo.findByUser(userId);
};

const getAllOrders = () => orderRepo.findAll();

// Permite ver el detalle de una orden solo si el usuario es admin o el
// dueno de la orden (segun la matriz de permisos de la seccion 3.4).
const getOrderDetails = async (orderId, requestingUser) => {
  const order = await orderRepo.findById(orderId);
  if (!order) throw new NotFoundError('Orden');

  if (requestingUser.role !== 'admin') {
    const userResult = await pool.query('SELECT user_id FROM users WHERE email = $1', [requestingUser.email]);
    const userId = userResult.rows[0]?.user_id;
    if (order.user_id !== userId) {
      throw new ForbiddenError('No puedes consultar ordenes de otro usuario');
    }
  }

  const details = await orderRepo.findDetailsByOrderId(orderId);
  return { order, details };
};

module.exports = { createOrder, getMyOrders, getAllOrders, getOrderDetails };
