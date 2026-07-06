const productRepo = require('../repositories/product.repository');
const { NotFoundError, ValidationError } = require('../middlewares/error.middleware');

const getAll = () => productRepo.findAll();

const getById = async (id) => {
  const product = await productRepo.findById(id);
  if (!product) throw new NotFoundError('Producto');
  return product;
};

const search = (term) => productRepo.search(term);

const create = async (data) => {
  if (!data.product_name) throw new ValidationError('El nombre es requerido');
  if (data.unit_price <= 0) throw new ValidationError('El precio debe ser mayor a 0');
  if (data.units_in_stock < 0) throw new ValidationError('El stock no puede ser negativo');
  return productRepo.create(data);
};

const update = async (id, data) => {
  const existing = await productRepo.findById(id);
  if (!existing) throw new NotFoundError('Producto');
  return productRepo.update(id, data);
};

const remove = async (id) => {
  const existing = await productRepo.findById(id);
  if (!existing) throw new NotFoundError('Producto');
  return productRepo.softDelete(id);
};

const reactivate = async (id) => {
  const existing = await productRepo.findById(id);
  if (!existing) throw new NotFoundError('Producto');
  return productRepo.reactivate(id);
};

// Solo para el panel de administracion: incluye productos activos e inactivos.
const getAllAdmin = (term) => productRepo.findAllAdmin(term);

// Incrementa o reduce el stock de un producto. delta puede ser positivo
// (reabastecimiento) o negativo (merma, ajuste manual), pero el resultado
// nunca puede quedar por debajo de cero.
const adjustStock = async (id, delta) => {
  const existing = await productRepo.findById(id);
  if (!existing) throw new NotFoundError('Producto');
  if (existing.units_in_stock + delta < 0) {
    throw new ValidationError('El ajuste dejaria el stock en un valor negativo', 'CANTIDAD_INVALIDA');
  }
  return productRepo.adjustStock(id, delta);
};

module.exports = {
  getAll, getById, search, create, update, remove, reactivate, getAllAdmin, adjustStock,
};