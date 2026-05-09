const configuredApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = (
  configuredApiUrl ||
  (import.meta.env.DEV ? "http://localhost:5000" : "https://digital-equb-2.onrender.com")
).replace(/\/$/, "");
const FALLBACK_API_BASE_URL = "https://digital-equb-2.onrender.com";
const API_URLS = API_BASE_URL === FALLBACK_API_BASE_URL
  ? [API_BASE_URL]
  : [API_BASE_URL, FALLBACK_API_BASE_URL];

const TOKEN_KEY = "digital-equb-token";
const USER_KEY = "digital-equb-user";

// Enhanced cache with TTL and size limits
class ApiCache {
  constructor(maxSize = 100, defaultTTL = 30000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

const apiCache = new ApiCache(100, 30000); // 100 entries, 30s TTL
const pendingRequests = new Map(); // For request deduplication

// Set up periodic cache cleanup
setInterval(() => apiCache.cleanup(), 60000); // Clean every minute

export function getStoredToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || token === "null" || token === "undefined") {
    return null;
  }
  return token;
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function setStoredAuth(token, user) {
  apiCache.clear();
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  apiCache.clear();
}

function getCacheKey(path, method, body, token) {
  return `${method}:${path}:${token || "anonymous"}:${body ? JSON.stringify(body) : ''}`;
}

// Enhanced error handling with retry logic
class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

// Request deduplication - prevents duplicate requests
function getPendingRequest(cacheKey) {
  return pendingRequests.get(cacheKey);
}

function setPendingRequest(cacheKey, promise) {
  pendingRequests.set(cacheKey, promise);
  
  // Clean up after request completes
  promise.finally(() => {
    pendingRequests.delete(cacheKey);
  });
}

// Retry logic for failed requests
async function retryRequest(requestFn, retries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (i === retries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError;
}

// Optimized API request function
export async function apiRequest(path, { 
  method = "GET", 
  body, 
  token, 
  headers = {}, 
  skipCache = false,
  cacheTTL = 30000,
  retries = 2
} = {}) {
  const authToken = token ?? getStoredToken();
  const cacheKey = getCacheKey(path, method, body, authToken);

  // Return cached data for GET requests if valid and not skipped
  if (method === "GET" && !skipCache && apiCache.has(cacheKey)) {
    const cachedData = apiCache.get(cacheKey);
    return cachedData;
  }

  // Check for pending request to prevent duplicates
  const pendingRequest = getPendingRequest(cacheKey);
  if (pendingRequest) {
    return pendingRequest;
  }

  // Create request promise
  const requestPromise = retryRequest(async () => {
    const requestOptions = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    };

    let response;
    let lastError;

    // Try each API URL until one works
    for (const baseUrl of API_URLS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        response = await fetch(`${baseUrl}${path}`, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status !== 404 || baseUrl === API_URLS[API_URLS.length - 1]) {
          break; // Found working URL or this is the last one
        }
      } catch (error) {
        lastError = error;
        response = null;
      }
    }

    if (!response) {
      throw new ApiError(
        `Cannot reach the API server. Check that ${API_BASE_URL}/api/health is online.`,
        0,
        { originalError: lastError?.message }
      );
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        payload?.message ||
        payload?.errors?.[0]?.msg ||
        "Something went wrong while contacting the server.";

      const error = new ApiError(message, response.status, payload);

      // Handle auth errors
      if (response.status === 401 && 
          !path.startsWith("/api/auth/login") && 
          !path.startsWith("/api/auth/register") && 
          !payload?.message?.toLowerCase().includes("password")) {
        clearStoredAuth();
      }

      throw error;
    }

    return payload;
  }, retries);

  // Set pending request for deduplication
  setPendingRequest(cacheKey, requestPromise);

  try {
    const result = await requestPromise;

    // Cache successful GET requests
    if (method === "GET") {
      apiCache.set(cacheKey, result, cacheTTL);
    }

    return result;
  } catch (error) {
    // Re-throw with better error handling
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      error.message || "Request failed",
      error.status || 0,
      { originalError: error }
    );
  }
}

// Batch API requests for better performance
export async function batchRequests(requests) {
  const results = await Promise.allSettled(requests);
  
  return results.map((result, index) => ({
    index,
    status: result.status,
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null,
  }));
}

// Optimized dashboard API call
export async function fetchDashboardData(options = {}) {
  return apiRequest("/api/dashboard-optimized/combined", {
    skipCache: options.skipCache || false,
    cacheTTL: options.cacheTTL || 60000, // 1 minute cache for dashboard
    ...options
  });
}

// Optimized group API calls
export async function fetchGroupList(options = {}) {
  const params = new URLSearchParams();
  
  if (options.status) params.append('status', options.status);
  if (options.frequency) params.append('frequency', options.frequency);
  if (options.search) params.append('search', options.search);
  if (options.page) params.append('page', options.page);
  if (options.limit) params.append('limit', options.limit);

  const path = `/api/groups${params.toString() ? `?${params.toString()}` : ''}`;
  
  return apiRequest(path, {
    skipCache: options.skipCache || false,
    cacheTTL: options.cacheTTL || 30000, // 30 seconds cache
  });
}

// Prefetching utility for better UX
export function prefetchData(path, options = {}) {
  // Don't prefetch in low-bandwidth scenarios
  if (navigator.connection && navigator.connection.saveData) {
    return;
  }

  // Fire and forget prefetch
  apiRequest(path, { ...options, cacheTTL: 60000 }).catch(() => {
    // Ignore prefetch errors
  });
}

// Cache management utilities
export const cacheUtils = {
  clear: () => apiCache.clear(),
  delete: (path, method = "GET", body, token) => {
    const cacheKey = getCacheKey(path, method, body, token);
    apiCache.delete(cacheKey);
  },
  invalidatePattern: (pattern) => {
    // Invalidate cache entries matching a pattern
    for (const key of apiCache.cache.keys()) {
      if (key.includes(pattern)) {
        apiCache.cache.delete(key);
      }
    }
  },
  getStats: () => ({
    size: apiCache.cache.size,
    maxSize: apiCache.maxSize,
  }),
};

export { API_BASE_URL, ApiError };
