import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/db';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User;
  currentRole: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (data: { name: string; email: string; phone?: string; password: string; role: UserRole }) => Promise<void>;
  logout: () => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  allUsers: User[];
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const users = db.getUsers();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('medisync_auth_token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('medisync_auth_token'));
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedId = localStorage.getItem('medisync_current_user_id');
    const found = users.find((u) => u.id === savedId);
    return found || users[0];
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('medisync_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('medisync_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const data = await api.post('/auth/login', { email, password, role });
      setToken(data.token);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      localStorage.setItem('medisync_auth_token', data.token);
      localStorage.setItem('medisync_current_user_id', data.user.id);
      return true;
    } catch (err) {
      console.error('Backend login error, trying local fallback:', err);
      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.isActive);
      if (found) {
        setCurrentUser(found);
        setIsAuthenticated(true);
        localStorage.setItem('medisync_current_user_id', found.id);
        return true;
      }
      throw err;
    }
  };

  const register = async (data: { name: string; email: string; phone?: string; password: string; role: UserRole }) => {
    await api.post('/auth/register', data);
  };

  const logout = () => {
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('medisync_auth_token');
    localStorage.removeItem('medisync_current_user_id');
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setIsAuthenticated(true);
      localStorage.setItem('medisync_current_user_id', target.id);
    }
  };

  const switchRole = (role: UserRole) => {
    const matchingUser = users.find((u) => u.role === role);
    if (matchingUser) {
      switchUser(matchingUser.id);
    }
  };

  const hasPermission = (requiredRole: UserRole | UserRole[]) => {
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'HOSPITAL_ADMIN') {
      return true;
    }
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(currentUser.role);
    }
    return currentUser.role === requiredRole;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser.role,
        token,
        isAuthenticated,
        login,
        register,
        logout,
        switchUser,
        switchRole,
        theme,
        toggleTheme,
        allUsers: users,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
