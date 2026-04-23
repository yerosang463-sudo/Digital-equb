const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('./config/env');

const { testConnection } = require('./config/db');
const { DatabaseMigrator } = require('./database/migrator');
const { autoMigrate } = require('./migrations/auto-migrate');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');

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
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const { execSync } = require('child_process');

function killPort(port) {
  try {
    // Windows: find and kill the process using the port
    const result = execSync(
      `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port} ^| findstr LISTENING') do taskkill /F /PID %a`,
      { shell: 'cmd.exe', stdio: 'pipe' }
    );
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
