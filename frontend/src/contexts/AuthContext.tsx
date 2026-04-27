import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router';
import { getUser, getToken, clearAuth, setAuth, authService } from '../services/api';

type UserRole = 'citizen' | 'officer' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Initialize auth state from local storage on mount
    const storedUser = getUser() as User | null;
    const storedToken = getToken();
    if (storedUser && storedToken) {
      setUser(storedUser);
      setTokenState(storedToken);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await authService.login(email, pass);
    setAuth(data.token, data.user);
    setUser(data.user);
    setTokenState(data.token);
    
    // Redirect based on role
    if (data.user.role === 'admin') navigate('/admin-dashboard');
    else if (data.user.role === 'officer') navigate('/officer-dashboard');
    else navigate('/citizen-dashboard');
  };

  const register = async (name: string, email: string, pass: string) => {
    await authService.register(name, email, pass);
    // Success handling will be done in the component, likely redirecting to login
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setTokenState(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
