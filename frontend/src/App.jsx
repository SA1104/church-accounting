import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './shared/Signup';
import Portal from './shared/Portal';
import Login from './shared/Login';
import PortalLayout from './shared/PortalLayout';
import ServiceView from './shared/ServiceView';
import ForgotPassword from './shared/ForgotPassword';
import ResetPassword from './shared/ResetPassword';
import SystemHealthDashboard from './apps/platform/pages/SystemHealthDashboard';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const safeGetItem = (key, fallback = null) => {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  };

  const safeSetItem = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {/* empty */}
  };

  const safeRemoveItem = (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {/* empty */}
  };

  const [token, setToken] = useState(() => safeGetItem('token'));
  const [user, setUser] = useState(() => {
    try {
      const u = safeGetItem('user');
      return u && u !== 'undefined' ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });

  const login = (newToken, newUser) => {
    safeSetItem('token', newToken);
    safeSetItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    safeRemoveItem('token');
    safeRemoveItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      <Router>
        <Routes>
          {/* Public / Entry Routes */}
          <Route path="/" element={<Portal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Main Portal Routes (Thematic Services) */}
          <Route path="/service" element={<PortalLayout />}>
            <Route path=":serviceId" element={<ServiceView />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/_admin/sys-health" element={<SystemHealthDashboard />} />

          {/* Catch-all redirect to Portal */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}
