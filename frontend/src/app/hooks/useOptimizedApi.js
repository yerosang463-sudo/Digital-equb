import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';

// Custom hook for optimized API calls with caching
export function useOptimizedApi(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { cache = true, cacheTime = 300000 } = options; // 5 minutes default cache

  // Simple in-memory cache
  const cacheRef = new Map();

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (cache && !forceRefresh && cacheRef.has(url)) {
      const cached = cacheRef.get(url);
      if (Date.now() - cached.timestamp < cacheTime) {
        setData(cached.data);
        setLoading(false);
        return cached.data;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiRequest(url);
      
      // Cache the result
      if (cache) {
        cacheRef.set(url, {
          data: result,
          timestamp: Date.now()
        });
      }
      
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, cache, cacheTime]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true)
  };
}
