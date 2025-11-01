import React, { createContext, useState, useEffect, useCallback } from 'react';
import API, { setAuthToken } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('zenaura_token');
    if (token) {
      setAuthToken(token);
      API.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          setAuthToken(null);
          localStorage.removeItem('zenaura_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // login(token, initialUser?) - if initialUser is provided we use it immediately
  // This avoids a race where components navigate before the /auth/me check completes
  const login = useCallback(async (token, initialUser = null) => {
    if (!token) return;
    localStorage.setItem('zenaura_token', token);
    setAuthToken(token);
    if (initialUser) {
      setUser(initialUser);
      return initialUser;
    }
    try {
      const res = await API.get('/auth/me');
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      setUser(null);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // call backend to revoke the token (best-effort, ignore errors)
      await API.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('zenaura_token');
    // redirect to login page after logout
    try {
      window.location.href = '/login';
    } catch (e) { /* ignore in non-browser env */ }
  }, []);

  // auto-logout on 401 responses (token expired/invalid)
  useEffect(() => {
    const interceptor = API.interceptors.response.use(
      res => res,
      err => {
        // Debug: log failing request details to help diagnose unexpected logouts
        try {
          const cfg = err && err.config ? err.config : {};
          const url = cfg.url || '(no url)';
          const method = cfg.method || '(no method)';
          const status = err && err.response ? err.response.status : '(no status)';
          const data = err && err.response ? err.response.data : null;
          console.warn('[API interceptor] request failed', { method, url, status, data });
        } catch (logErr) {
          console.warn('[API interceptor] failed to log error details', logErr);
        }

        if (err && err.response && err.response.status === 401) {
          // preserve original behaviour (auto-logout) but log to console first
          console.warn('[Auth] auto-logout triggered by 401 for', err.config && err.config.url);
          logout();
        }
        return Promise.reject(err);
      }
    );
    return () => API.interceptors.response.eject(interceptor);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
