import { useState, useEffect, useCallback } from 'react';
import { UserWithoutPassword } from '../types/database';

interface AuthState {
  user: UserWithoutPassword | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  const checkAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setState(prev => ({ ...prev, user: data.user, loading: false }));
        } else {
          setState(prev => ({ ...prev, user: null, loading: false }));
        }
      } else {
        setState(prev => ({ ...prev, user: null, loading: false }));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setState(prev => ({ ...prev, user: null, loading: false, error: 'Authentication check failed' }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({ ...prev, user: data.user, loading: false }));
        return true;
      } else {
        setState(prev => ({ ...prev, error: data.error, loading: false }));
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setState(prev => ({ ...prev, error: 'Login failed', loading: false }));
      return false;
    }
  }, []);

  const register = useCallback(async (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({ ...prev, user: data.user, loading: false }));
        return true;
      } else {
        setState(prev => ({ ...prev, error: data.error, loading: false }));
        return false;
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setState(prev => ({ ...prev, error: 'Registration failed', loading: false }));
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setState(prev => ({ ...prev, user: null, loading: false, error: null }));
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails on server, clear local state
      setState(prev => ({ ...prev, user: null, loading: false, error: null }));
      window.location.href = '/login';
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...state,
    login,
    register,
    logout,
    checkAuth
  };
}
