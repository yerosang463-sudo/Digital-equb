const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  const startTime = process.hrtime.bigint();
  
  // Add performance tracking to response
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Date.now() - start;
    const durationNanos = Number(end - startTime) / 1000000; // Convert to milliseconds
    
    // Log performance data
    console.log(`🚀 ${req.method} ${req.originalUrl} - ${duration}ms - ${res.statusCode}`);
    
    // Warn on slow requests
    if (duration > 500) {
      console.warn(`⚠️  SLOW REQUEST: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
    
    // Critical warnings for very slow requests
    if (duration > 2000) {
      console.error(`🚨 CRITICAL: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
    
    // Add performance headers
    res.set('X-Response-Time', `${duration}ms`);
    res.set('X-Response-Time-Nanos', `${durationNanos.toFixed(3)}ms`);
    
    // Log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance: ${req.method} ${req.originalUrl}`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Content-Length: ${res.get('Content-Length') || 'unknown'}`);
      console.log(`   User-Agent: ${req.get('User-Agent') || 'unknown'}`);
    }
  });
  
  next();
};

// Database query performance monitoring
const createPerformancePool = (pool) => {
  const originalQuery = pool.query;
  
  pool.query = function(...args) {
    const start = Date.now();
    const query = args[0];
    const queryType = getQueryType(query);
    
    return originalQuery.apply(this, args)
      .then(result => {
        const duration = Date.now() - start;
        
        // Log all queries in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🗄️  DB Query (${duration}ms): ${queryType}`);
          console.log(`   SQL: ${query.toString().substring(0, 100)}...`);
        }
        
        // Warn on slow queries
        if (duration > 100) {
          console.warn(`⚠️  SLOW QUERY (${duration}ms): ${queryType}`);
          console.warn(`   SQL: ${query.toString().substring(0, 200)}...`);
        }
        
        // Critical warnings for very slow queries
        if (duration > 500) {
          console.error(`🚨 CRITICAL QUERY (${duration}ms): ${queryType}`);
          console.error(`   SQL: ${query.toString()}`);
        }
        
        return result;
      })
      .catch(error => {
        const duration = Date.now() - start;
        console.error(`❌ QUERY FAILED (${duration}ms): ${queryType}`);
        console.error(`   SQL: ${query.toString()}`);
        console.error(`   Error: ${error.message}`);
        throw error;
      });
  };
  
  return pool;
};

// Helper function to categorize query types
const getQueryType = (query) => {
  const sql = query.toString().toUpperCase();
  
  if (sql.includes('SELECT')) {
    if (sql.includes('COUNT')) return 'COUNT';
    if (sql.includes('JOIN')) return 'SELECT_JOIN';
    if (sql.includes('GROUP_CONCAT')) return 'SELECT_AGGREGATE';
    return 'SELECT';
  }
  if (sql.includes('INSERT')) return 'INSERT';
  if (sql.includes('UPDATE')) return 'UPDATE';
  if (sql.includes('DELETE')) return 'DELETE';
  if (sql.includes('CREATE')) return 'CREATE';
  if (sql.includes('ALTER')) return 'ALTER';
  if (sql.includes('INDEX')) return 'INDEX';
  
  return 'OTHER';
};

// Memory usage monitoring
const memoryMonitor = () => {
  const used = process.memoryUsage();
  const total = require('os').totalmem();
  const free = require('os').freemem();
  
  console.log(`💾 Memory Usage:`);
  console.log(`   RSS: ${Math.round(used.rss / 1024 / 1024)}MB`);
  console.log(`   Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
  console.log(`   Heap Total: ${Math.round(used.heapTotal / 1024 / 1024)}MB`);
  console.log(`   System Free: ${Math.round(free / 1024 / 1024)}MB`);
  console.log(`   System Total: ${Math.round(total / 1024 / 1024)}MB`);
  
  // Warn on high memory usage
  if (used.heapUsed > 500 * 1024 * 1024) { // 500MB
    console.warn(`⚠️  High memory usage: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
  }
};

// Performance metrics collection
const performanceMetrics = {
  requests: [],
  queries: [],
  errors: [],
  
  addRequest(req, duration, statusCode) {
    this.requests.push({
      method: req.method,
      path: req.originalUrl,
      duration,
      statusCode,
      timestamp: new Date()
    });
    
    // Keep only last 1000 requests
    if (this.requests.length > 1000) {
      this.requests = this.requests.slice(-1000);
    }
  },
  
  addQuery(query, duration, error = null) {
    this.queries.push({
      type: getQueryType(query),
      duration,
      error,
      timestamp: new Date()
    });
    
    // Keep only last 1000 queries
    if (this.queries.length > 1000) {
      this.queries = this.queries.slice(-1000);
    }
  },
  
  getMetrics() {
    const recentRequests = this.requests.slice(-100);
    const recentQueries = this.queries.slice(-100);
    
    return {
      requests: {
        total: this.requests.length,
        recent: recentRequests.length,
        averageTime: recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length || 0,
        slowRequests: recentRequests.filter(r => r.duration > 500).length,
        errorRate: (recentRequests.filter(r => r.statusCode >= 400).length / recentRequests.length * 100).toFixed(2)
      },
      queries: {
        total: this.queries.length,
        recent: recentQueries.length,
        averageTime: recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length || 0,
        slowQueries: recentQueries.filter(q => q.duration > 100).length,
        errorRate: (recentQueries.filter(q => q.error).length / recentQueries.length * 100).toFixed(2)
      },
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
};

module.exports = {
  performanceMiddleware,
  createPerformancePool,
  memoryMonitor,
  performanceMetrics
};
