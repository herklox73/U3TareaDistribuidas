const orderService = require('../services/order.service');

// POST /orders  body: { items: [{ product_id, quantity }, ...] }
// Tambien acepta el formato anterior { product_id, quantity } por compatibilidad.
const purchase = async (req, res) => {
  const items = req.body.items || [{ product_id: req.body.product_id, quantity: req.body.quantity }];
  const result = await orderService.createOrder(req.user.email, items);
  res.status(201).json({ message: 'Compra realizada con exito', ...result });
};

// GET /orders/mine  (customer)
const getMine = async (req, res) => {
  const orders = await orderService.getMyOrders(req.user.email);
  res.json(orders);
};

// GET /orders  (admin)
const getAll = async (req, res) => {
  const orders = await orderService.getAllOrders();
  res.json(orders);
};

// GET /orders/:id/details  (admin o dueno de la orden)
const getDetails = async (req, res) => {
  const result = await orderService.getOrderDetails(req.params.id, req.user);
  res.json(result);
};

module.exports = { purchase, getMine, getAll, getDetails };
