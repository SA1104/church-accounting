// frontend/src/apps/stock/StockContextProvider.jsx
// Stock Think - Capability Context Provider (Platform 3.1)
// Independent from Church Think — never references church assignments/committees
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../App';

const StockContext = createContext(null);

export function useStockContext() {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error('useStockContext must be used inside StockContextProvider');
  return ctx;
}

export function StockContextProvider({ children }) {
  const { token } = useAuth();

  const [workspace, setWorkspace] = useState({
    workspace_id: null,
    name: '내 투자계정',
    investment_style: 'Growth',
    risk_preference: 'MEDIUM'
  });

  const [researchHistory, setResearchHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    if (!token) return;
    try {
      // Will call /api/stock/workspace when backend is ready
      // For now, use local storage fallback
      const savedWorkspace = localStorage.getItem('stockWorkspace');
      if (savedWorkspace) {
        setWorkspace(JSON.parse(savedWorkspace));
      }
    } catch (err) {
      console.warn('[StockContext] Failed to load workspace:', err.message);
    }
  }, [token]);

  const fetchResearchHistory = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/research', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResearchHistory(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('[StockContext] Failed to fetch research history:', err.message);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([fetchWorkspace(), fetchResearchHistory()]).finally(() => setLoading(false));
  }, [token, fetchWorkspace, fetchResearchHistory]);

  const updateWorkspaceSettings = useCallback((settings) => {
    const updated = { ...workspace, ...settings };
    setWorkspace(updated);
    localStorage.setItem('stockWorkspace', JSON.stringify(updated));
  }, [workspace]);

  const addResearchResult = useCallback((result) => {
    setResearchHistory(prev => [result, ...prev].slice(0, 50));
  }, []);

  const value = {
    workspace,
    updateWorkspaceSettings,
    researchHistory,
    addResearchResult,
    fetchResearchHistory,
    loading,
    capability: 'stock',
    workspaceName: workspace.name
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
}
