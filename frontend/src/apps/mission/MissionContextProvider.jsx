// frontend/src/apps/mission/MissionContextProvider.jsx
// Mission Think - Capability Context Provider (Platform 3.1)
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from '../../App';

const MissionContext = createContext(null);

export function useMissionContext() {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error('useMissionContext must be used inside MissionContextProvider');
  return ctx;
}

export function MissionContextProvider({ children }) {
  const [workspace] = useState({
    name: '선교 협력',
    country: '인도'
  });

  const value = {
    workspace,
    capability: 'mission',
    workspaceName: workspace.name
  };

  return (
    <MissionContext.Provider value={value}>
      {children}
    </MissionContext.Provider>
  );
}
