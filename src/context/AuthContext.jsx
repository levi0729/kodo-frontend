import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, setToken } from '@/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('kodo_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = sessionStorage.getItem('kodo_token');
    // Safety timeout — never hang on the loading screen longer than 12s
    const safetyTimer = setTimeout(() => setInitializing(false), 12000);
    if (token && !currentUser) {
      authApi.me()
        .then(data => {
          setCurrentUser(data.user);
          sessionStorage.setItem('kodo_user', JSON.stringify(data.user));
        })
        .catch(() => {
          sessionStorage.removeItem('kodo_token');
          sessionStorage.removeItem('kodo_user');
          setCurrentUser(null);
        })
        .finally(() => { clearTimeout(safetyTimer); setInitializing(false); });
    } else {
      clearTimeout(safetyTimer);
      setInitializing(false);
    }
    return () => clearTimeout(safetyTimer);
  }, []);

  // Handle session expiry from API interceptor
  useEffect(() => {
    const handleExpired = () => setCurrentUser(null);
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      setCurrentUser(data.user);
      sessionStorage.setItem('kodo_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async ({ displayName, email, password, passwordConfirmation, jobTitle, phoneNumber, username }) => {
    setLoading(true);
    try {
      const data = await authApi.register({
        username: username || email.split('@')[0],
        email,
        password,
        password_confirmation: passwordConfirmation,
        display_name: displayName,
        job_title: jobTitle || '',
        phone_number: phoneNumber || '',
      });
      setCurrentUser(data.user);
      sessionStorage.setItem('kodo_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch { /* ignore */ } finally {
      setCurrentUser(null);
      sessionStorage.removeItem('kodo_user');
      sessionStorage.removeItem('kodo_token');
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback((updates) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      sessionStorage.setItem('kodo_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.me();
      setCurrentUser(data.user);
      sessionStorage.setItem('kodo_user', JSON.stringify(data.user));
    } catch { /* ignore */ }
  }, []);

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-kodo-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-kodo-text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      updateUser,
      login,
      register,
      logout,
      refreshUser,
      isLoggedIn: !!currentUser,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
