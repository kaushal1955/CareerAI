import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loginRequest, registerRequest } from '../services/authService';

const TOKEN_KEY = 'careerai_token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const login = useCallback(async (email, password) => {
    const data = await loginRequest({ email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerRequest(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // Clerk-compatible async getToken(), so existing pages can keep calling
  // `await getToken()` without changes.
  const getToken = useCallback(async () => token, [token]);

  const value = useMemo(
    () => ({
      isLoaded,
      isSignedIn: Boolean(token),
      userId: user?._id || null,
      user,
      setUser,
      getToken,
      login,
      register,
      logout,
    }),
    [isLoaded, token, user, getToken, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export function useUser() {
  const { user, isLoaded } = useAuth();
  return { user, isLoaded };
}
