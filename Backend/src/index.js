const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('./config/env');

const { testConnection } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'Digital Equb API is running', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`Digital Equb API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
});
