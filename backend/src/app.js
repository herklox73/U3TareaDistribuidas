require('dotenv').config();
require('express-async-errors');
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const passport = require('passport');
const fs   = require('fs');
const path = require('path');

const logger = require('./config/logger');
const { errorHandler }  = require('./middlewares/error.middleware');
const { requestLogger } = require('./middlewares/log.middleware');
require('./events/subscribers/logSubscriber'); // registra los listeners del patron Observer

const authRoutes    = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes   = require('./routes/order.routes');
const logRoutes     = require('./routes/log.routes');

// Crear carpeta logs si no existe
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(passport.initialize());
app.use(requestLogger);

app.use('/auth',     authRoutes);
app.use('/products', productRoutes);
app.use('/orders',   orderRoutes);
app.use('/logs',     logRoutes);

app.get('/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

app.use((req, res) => res.status(404).json({ error: `Ruta ${req.path} no encontrada` }));
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => logger.info(`Backend corriendo en puerto ${PORT}`));

module.exports = app;