// frontend/src/core/WorkspaceProvider.jsx
// Platform 3.1 - Platform-level Workspace Provider
// Tracks which capability/workspace is currently active at Platform OS level
// Does NOT know about Capability internals (committee, assignment, portfolio, etc.)
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { plugins } from './plugins';

const WorkspaceContext = createContext(null);

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

function detectCapability(pathname) {
  if (pathname.startsWith('/app/stock')) return 'stock';
  if (pathname.startsWith('/app/estate')) return 'estate';
  if (pathname.startsWith('/app/mission')) return 'mission';
  if (pathname.startsWith('/app/church') ||
      pathname.startsWith('/vouchers') ||
      pathname.startsWith('/reports') ||
      pathname.startsWith('/audit') ||
      pathname.startsWith('/settings')) return 'church';
  return 'church'; // default
}

export function WorkspaceProvider({ children }) {
  const location = useLocation();
  const [activeCapability, setActiveCapability] = useState(() => detectCapability(location.pathname));

  useEffect(() => {
    const cap = detectCapability(location.pathname);
    setActiveCapability(cap);
  }, [location.pathname]);

  const activePlugin = plugins.find(p => p.id === activeCapability);

  const value = {
    activeCapability,
    activePlugin,
    // Platform only knows workspace ID, not internals
    getWorkspaceLabel: () => activePlugin?.defaultWorkspace || 'My Workspace'
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
