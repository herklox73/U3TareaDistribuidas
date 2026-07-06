const productService = require('../services/product.service');
const { ValidationError } = require('../middlewares/error.middleware');
const emitter = require('../events/eventEmitter');

const getAll  = async (req, res) => res.json(await productService.getAll());
const getById = async (req, res) => res.json(await productService.getById(req.params.id));
const search  = async (req, res) => res.json(await productService.search(req.query.q || ''));

const create = async (req, res) => {
  const product = await productService.create(req.body);
  emitter.emit('product.created', { userEmail: req.user.email, productName: product.product_name });
  res.status(201).json(product);
};

const update = async (req, res) => {
  const product = await productService.update(req.params.id, req.body);
  emitter.emit('product.updated', { userEmail: req.user.email, productId: req.params.id });
  res.json(product);
};

const remove = async (req, res) => {
  await productService.remove(req.params.id);
  emitter.emit('product.deleted', { userEmail: req.user.email, productId: req.params.id });
  res.json({ message: 'Producto desactivado correctamente' });
};

// PATCH /products/:id/reactivate (admin) - vuelve a poner el producto como activo
const reactivate = async (req, res) => {
  const product = await productService.reactivate(req.params.id);
  emitter.emit('product.reactivated', { userEmail: req.user.email, productId: req.params.id });
  res.json(product);
};

// GET /products/all?q= (admin) - incluye productos activos e inactivos
const getAllAdmin = async (req, res) => {
  res.json(await productService.getAllAdmin(req.query.q || undefined));
};

// PATCH /products/:id/stock  body: { delta: number }
const adjustStock = async (req, res) => {
  const { delta } = req.body;
  if (!Number.isInteger(delta) || delta === 0) {
    throw new ValidationError('delta debe ser un entero distinto de 0', 'CANTIDAD_INVALIDA');
  }
  const updated = await productService.adjustStock(req.params.id, delta);
  emitter.emit('stock.updated', { userEmail: req.user.email, productId: req.params.id, delta });
  res.json(updated);
};

module.exports = {
  getAll, getById, search, create, update, remove, reactivate, getAllAdmin, adjustStock,
};
