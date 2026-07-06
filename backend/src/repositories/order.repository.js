const pool = require('../config/db');

const createHeader = async (userId, total, client) => {
  const { rows } = await client.query(
    'INSERT INTO purchase_orders (user_id, total) VALUES ($1, $2) RETURNING *',
    [userId, total]
  );
  return rows[0];
};

const addDetail = async (orderId, { product_id, quantity, unit_price, subtotal }, client) => {
  const { rows } = await client.query(
    `INSERT INTO purchase_order_details (order_id, product_id, quantity, unit_price, subtotal)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [orderId, product_id, quantity, unit_price, subtotal]
  );
  return rows[0];
};

const findByUser = async (userId) => {
  const { rows } = await pool.query(
    'SELECT * FROM purchase_orders WHERE user_id = $1 ORDER BY order_id DESC',
    [userId]
  );
  return rows;
};

const findAll = async () => {
  const { rows } = await pool.query(
    `SELECT po.*, u.email AS user_email
     FROM purchase_orders po
     LEFT JOIN users u ON po.user_id = u.user_id
     ORDER BY po.order_id DESC`
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM purchase_orders WHERE order_id = $1', [id]);
  return rows[0] || null;
};

const findDetailsByOrderId = async (orderId) => {
  const { rows } = await pool.query(
    `SELECT od.*, p.product_name
     FROM purchase_order_details od
     LEFT JOIN products p ON od.product_id = p.product_id
     WHERE od.order_id = $1
     ORDER BY od.id`,
    [orderId]
  );
  return rows;
};

module.exports = { createHeader, addDetail, findByUser, findAll, findById, findDetailsByOrderId };
