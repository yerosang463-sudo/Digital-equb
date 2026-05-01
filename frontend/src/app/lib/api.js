const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

const TOKEN_KEY = "digital-equb-token";
const USER_KEY = "digital-equb-user";

const cache = new Map();
const CACHE_DURATION = 30000; // 30 seconds cache for GET requests

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setStoredAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  cache.clear(); // Clear cache on logout
}

function getCacheKey(path, method, body) {
  return `${method}:${path}:${body ? JSON.stringify(body) : ''}`;
}

function isCacheValid(timestamp) {
  return Date.now() - timestamp < CACHE_DURATION;
}

export async function apiRequest(path, { method = "GET", body, token, headers = {}, skipCache = false } = {}) {
  const authToken = token ?? getStoredToken();
  const cacheKey = getCacheKey(path, method, body);

  // Return cached data for GET requests if valid and not skipped
  if (method === "GET" && !skipCache && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (isCacheValid(cached.timestamp)) {
      return cached.data;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.errors?.[0]?.msg ||
      "Something went wrong while contacting the server.";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  // Cache successful GET requests
  if (method === "GET" && response.ok) {
    cache.set(cacheKey, {
      data: payload,
      timestamp: Date.now()
    });
  }

  return payload;
}

export { API_BASE_URL };
