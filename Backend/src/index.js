const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
require('./config/env');

const { testConnection } = require('./config/db');
const { DatabaseMigrator } = require('./database/migrator');
const { autoMigrate } = require('./database/auto-migrate');
const { errorHandler } = require('./middleware/errorHandler');
const { performanceMiddleware, createPerformancePool, memoryMonitor } = require('./middleware/performance');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const dashboardOptimizedRoutes = require('./routes/dashboard-optimized');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

const defaultCorsOrigins = [
  'https://digitaequb.onrender.com',
  'https://digital-equb-frontend.onrender.com',
  'https://digital-equb-2.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
];

const envCorsOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS || '').split(','),
]
  .map((origin) => (origin || '').trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = [...new Set([...envCorsOrigins, ...defaultCorsOrigins])];

// Add compression middleware for 40-60% smaller responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Good balance of speed vs compression
  threshold: 1024, // Only compress responses > 1KB
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Add performance monitoring middleware
app.use(performanceMiddleware);

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'Digital Equb API is running', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dashboard-optimized', dashboardOptimizedRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const { execSync } = require('child_process');
const { platform } = require('os');

function killPort(port) {
  try {
    let command;
    
    if (platform() === 'win32') {
      // Windows: find and kill the process using the port
      command = `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port} ^| findstr LISTENING') do taskkill /F /PID %a`;
    } else {
      // Linux/Mac: find and kill the process using the port
      command = `lsof -ti:${port} | xargs kill -9`;
    }
    
    const result = execSync(command, { stdio: 'pipe' });
    console.log(`Killed process on port ${port}`);
  } catch {
    // No process was using the port, or kill failed silently
  }
}

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Test database connection first
    await testConnection();
    console.log('Database connection established');
    
    // Run automated migrations
    await DatabaseMigrator.runMigrations();
    console.log('Database initialization completed');
    
    // Run auto-migration for has_paid_current_round column
    await autoMigrate();
    
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    
    // In development, provide helpful error messages
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n Troubleshooting tips:');
      console.log('   1. Make sure MySQL is running');
      console.log('   2. Check your .env database credentials');
      console.log('   3. Ensure the database exists');
      console.log('   4. Check if migration files exist in backend/src/database/\n');
    }
    
    throw error;
  }
}

function startServer(retried = false) {
  const server = app.listen(PORT, () => {
    console.log(`Digital Equb API server running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
    console.log(` Admin login: yerosang463@gmail.com / @yero27101620`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && !retried) {
      console.warn(`  Port ${PORT} is in use. Killing existing process and retrying...`);
      killPort(PORT);
      setTimeout(() => startServer(true), 1500);
    } else {
      console.error(' Server error:', err.message);
      process.exit(1);
    }
  });

  // Graceful shutdown — releases the port cleanly on Ctrl+C or SIGTERM
  const shutdown = () => {
    console.log('\n Shutting down server gracefully...');
    server.close(() => {
      console.log(' Server closed. Port released.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Initialize database and start server
async function bootstrap() {
  try {
    await initializeDatabase();
    startServer();
  } catch (error) {
    console.error('Failed to start application:', error.message);
    process.exit(1);
  }
}

bootstrap();
