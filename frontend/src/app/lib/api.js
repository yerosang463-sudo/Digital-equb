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

const cache = new Map();
const CACHE_DURATION = 30000; // 30 seconds cache for GET requests

export function getStoredToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || token === "null" || token === "undefined") {
    return null;
  }

  return token;
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function setStoredAuth(token, user) {
  cache.clear();
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  cache.clear(); // Clear cache on logout
}

function getCacheKey(path, method, body, token) {
  return `${method}:${path}:${token || "anonymous"}:${body ? JSON.stringify(body) : ''}`;
}

function isCacheValid(timestamp) {
  return Date.now() - timestamp < CACHE_DURATION;
}

export async function apiRequest(path, { method = "GET", body, token, headers = {}, skipCache = false } = {}) {
  const authToken = token ?? getStoredToken();
  const cacheKey = getCacheKey(path, method, body, authToken);

  // Return cached data for GET requests if valid and not skipped
  if (method === "GET" && !skipCache && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (isCacheValid(cached.timestamp)) {
      return cached.data;
    }
  }

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
  for (const baseUrl of API_URLS) {
    try {
      response = await fetch(`${baseUrl}${path}`, requestOptions);

      if (response.status !== 404 || baseUrl === API_URLS[API_URLS.length - 1]) {
        break;
      }
    } catch (error) {
      response = null;
    }
  }

  if (!response) {
    throw new Error(
      `Cannot reach the API server. Check that ${API_BASE_URL}/api/health is online.`
    );
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.errors?.[0]?.msg ||
      "Something went wrong while contacting the server.";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;

    if (response.status === 401 && !path.startsWith("/api/auth/login") && !path.startsWith("/api/auth/register")) {
      clearStoredAuth();
    }

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
