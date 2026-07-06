const express = require('express');
const router  = express.Router();
const c = require('../controllers/log.controller');
const auth = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.use(auth);

// Consultar registro de eventos: solo admin
router.get('/', requireRole('admin'), c.getLogs);

module.exports = router;
