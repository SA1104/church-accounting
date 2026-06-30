// frontend/src/apps/estate/EstateContextProvider.jsx
// Estate Think - Capability Context Provider (Platform 3.1)
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from '../../App';

const EstateContext = createContext(null);

export function useEstateContext() {
  const ctx = useContext(EstateContext);
  if (!ctx) throw new Error('useEstateContext must be used inside EstateContextProvider');
  return ctx;
}

export function EstateContextProvider({ children }) {
  const [workspace] = useState({
    name: '서울권 분석',
    region: '서울'
  });

  const value = {
    workspace,
    capability: 'estate',
    workspaceName: workspace.name
  };

  return (
    <EstateContext.Provider value={value}>
      {children}
    </EstateContext.Provider>
  );
}
