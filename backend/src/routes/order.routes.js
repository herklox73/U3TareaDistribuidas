const express = require('express');
const router  = express.Router();
const c = require('../controllers/order.controller');
const auth = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.use(auth);

// Registrar compra: solo customer
router.post('/', requireRole('customer'), c.purchase);
router.post('/purchase', requireRole('customer'), c.purchase); // alias retrocompatible

// Ver mis propias ordenes: solo customer
router.get('/mine', requireRole('customer'), c.getMine);

// Ver todas las ordenes: solo admin
router.get('/', requireRole('admin'), c.getAll);

// Ver detalle de una orden: admin o dueno de la orden (se valida en el service)
router.get('/:id/details', requireRole('admin', 'customer'), c.getDetails);

module.exports = router;
