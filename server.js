const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scan');
const alertsRoutes = require('./routes/alerts');
const licensesRoutes = require('./routes/licenses');
const pushRoutes = require('./routes/push');
const tradesRoutes = require('./routes/trades');

const app = express();
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/licenses', licensesRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/trades', tradesRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`ENLIGHT QConnect backend on port ${PORT}`));