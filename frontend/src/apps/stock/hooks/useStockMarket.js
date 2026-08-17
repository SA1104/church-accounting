import { useState, useEffect, useCallback, useRef } from 'react';
import { getStockHealth, getKoreaMarketLatest } from '../api/stockApi';

export function useStockMarket() {
  const [state, setState] = useState({
    status: 'idle',
    health: null,
    koreaLatest: null,
    error: null
  });

  const abortControllerRef = useRef(null);

  const fetchMarket = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState(prev => ({ ...prev, status: 'loading', error: null }));

    try {
      const [healthRes, krRes] = await Promise.all([
        getStockHealth(signal).catch(() => ({ data: { apiStatus: 'ERROR' } })),
        getKoreaMarketLatest(signal).catch(e => {
          if (e.code === 'DATA_NOT_READY' || e.code === 'STOCK_SCHEMA_NOT_READY') throw e;
          return { data: null };
        })
      ]);

      setState({
        status: 'success',
        health: healthRes?.data,
        koreaLatest: krRes?.data,
        meta: krRes?.meta,
        error: null
      });
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'TIMEOUT') return;
      if (err.code === 'STOCK_SCHEMA_NOT_READY' || err.code === 'DATA_NOT_READY') {
        setState({ status: 'data_not_ready', health: null, koreaLatest: null, error: err.message });
      } else {
        setState({ status: 'error', health: null, koreaLatest: null, error: err.message || 'Error occurred' });
      }
    }
  }, []);

  useEffect(() => {
    fetchMarket();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchMarket]);

  return { ...state, refetch: fetchMarket };
}
