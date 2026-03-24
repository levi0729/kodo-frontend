import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, verification as verificationApi, setToken } from '@/services/api';

const AuthContext = createContext(null);

const DEVICE_TOKEN_KEY = 'kodo_device_token';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('kodo_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Verification state
  const [verificationPending, setVerificationPending] = useState(null);
  // { userId, email, phone, hasPhone }

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('kodo_token');
    if (token && !currentUser) {
      authApi.me()
        .then(data => {
          setCurrentUser(data.user);
          localStorage.setItem('kodo_user', JSON.stringify(data.user));
        })
        .catch(() => {
          localStorage.removeItem('kodo_token');
          localStorage.removeItem('kodo_user');
          setCurrentUser(null);
        })
        .finally(() => setInitializing(false));
    } else {
      setInitializing(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const deviceToken = localStorage.getItem(DEVICE_TOKEN_KEY);
      const data = await authApi.login(email, password, deviceToken);

      if (data.verification_required) {
        // Password was correct but 2FA is needed
        setVerificationPending({
          userId: data.user_id,
          email: data.email,
          phone: data.phone,
          hasPhone: data.has_phone,
        });
        return { success: false, verificationRequired: true };
      }

      // Trusted device — login completed directly
      setCurrentUser(data.user);
      localStorage.setItem('kodo_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const sendVerificationCode = useCallback(async () => {
    if (!verificationPending) return { success: false };
    try {
      const data = await verificationApi.sendCode(verificationPending.userId);
      return { success: true, destination: data.destination, devCode: data.dev_code };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [verificationPending]);

  const verifyCode = useCallback(async (code, rememberDevice = false) => {
    if (!verificationPending) return { success: false };
    setLoading(true);
    try {
      const data = await verificationApi.verifyCode(verificationPending.userId, code, rememberDevice);

      if (data.token) {
        setToken(data.token);
      }

      // Save device token if remember was requested
      if (data.device_token) {
        localStorage.setItem(DEVICE_TOKEN_KEY, data.device_token);
      }

      setCurrentUser(data.user);
      localStorage.setItem('kodo_user', JSON.stringify(data.user));
      setVerificationPending(null);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [verificationPending]);

  const cancelVerification = useCallback(() => {
    setVerificationPending(null);
  }, []);

  const register = useCallback(async ({ displayName, email, password, passwordConfirmation, jobTitle, phoneNumber, username }) => {
    setLoading(true);
    try {
      const data = await authApi.register({
        username: username || email.split('@')[0],
        email,
        password,
        password_confirmation: passwordConfirmation || password,
        display_name: displayName,
        job_title: jobTitle || '',
        phone_number: phoneNumber || '',
      });
      setCurrentUser(data.user);
      localStorage.setItem('kodo_user', JSON.stringify(data.user));
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
      localStorage.removeItem('kodo_user');
      localStorage.removeItem('kodo_token');
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.me();
      setCurrentUser(data.user);
      localStorage.setItem('kodo_user', JSON.stringify(data.user));
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
      login,
      register,
      logout,
      refreshUser,
      isLoggedIn: !!currentUser,
      loading,
      verificationPending,
      sendVerificationCode,
      verifyCode,
      cancelVerification,
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
