const express = require('express');
const router  = express.Router();
const c = require('../controllers/product.controller');
const auth = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.use(auth);

// Consulta de productos activos: admin y customer
router.get('/',       c.getAll);
router.get('/search', c.search);

// Vista administrativa (incluye productos inactivos): solo admin.
// Debe ir antes de '/:id' para que Express no la confunda con un id.
router.get('/all', requireRole('admin'), c.getAllAdmin);

router.get('/:id', c.getById);

// Gestion de productos: solo admin
router.post('/',                requireRole('admin'), c.create);
router.put('/:id',              requireRole('admin'), c.update);
router.patch('/:id/stock',      requireRole('admin'), c.adjustStock);
router.patch('/:id/reactivate', requireRole('admin'), c.reactivate);
router.delete('/:id',           requireRole('admin'), c.remove);

module.exports = router;
