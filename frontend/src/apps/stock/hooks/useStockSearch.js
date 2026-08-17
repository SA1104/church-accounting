import { useState, useEffect, useCallback, useRef } from 'react';
import { searchStocks } from '../api/stockApi';

export function useStockSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [market, setMarket] = useState('');
  const [state, setState] = useState({
    status: 'idle', // idle | loading | success | empty | data_not_ready | error
    data: null,
    meta: null,
    error: null
  });

  const abortControllerRef = useRef(null);

  const fetchSearch = useCallback(async (searchQuery, searchMarket) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Empty query policy: return all or return empty?
    // Instruction says "빈 검색어 정책을 명확히 하십시오. 전체 목록 조회 또는 추천 종목 없음. 임의의 인기 종목을 생성하지 마십시오."
    // We will do: return empty if query is empty and market is empty. 
    // Actually, let's just let it fetch all if query is empty (limit 20).
    
    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ ...prev, status: 'loading', error: null }));
    
    try {
      const res = await searchStocks({ q: searchQuery, market: searchMarket }, abortControllerRef.current.signal);
      
      if (!res.data || res.data.length === 0) {
        setState({ status: 'empty', data: [], meta: res.meta, error: null });
      } else {
        setState({ status: 'success', data: res.data, meta: res.meta, error: null });
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'TIMEOUT') return;
      if (err.code === 'STOCK_SCHEMA_NOT_READY' || err.code === 'DATA_NOT_READY') {
        setState({ status: 'data_not_ready', data: null, meta: null, error: err.message });
      } else {
        setState({ status: 'error', data: null, meta: null, error: err.message || 'Error occurred' });
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSearch(query, market);
    }, 300); // Debounce
    return () => clearTimeout(timer);
  }, [query, market, fetchSearch]);

  return {
    query,
    setQuery,
    market,
    setMarket,
    ...state,
    refetch: () => fetchSearch(query, market)
  };
}
