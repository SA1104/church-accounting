import { useState, useEffect, useCallback, useRef } from 'react';
import { getStockDetail, getStockDailyBars, getStockSnapshots } from '../api/stockApi';

export function useStockDetail(stockCode) {
  const [state, setState] = useState({
    status: 'idle',
    instrument: null,
    latestBar: null,
    bars: [],
    snapshots: [],
    meta: null,
    error: null
  });

  const abortControllerRef = useRef(null);

  const fetchDetail = useCallback(async () => {
    if (!stockCode) return;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState(prev => ({ ...prev, status: 'loading', error: null }));

    try {
      const [detailRes, barsRes, snapRes] = await Promise.all([
        getStockDetail(stockCode, signal),
        getStockDailyBars(stockCode, { limit: 100 }, signal),
        getStockSnapshots(stockCode, signal)
      ]);

      setState({
        status: 'success',
        instrument: detailRes.data.instrument,
        latestBar: detailRes.data.latestBar,
        bars: barsRes.data || [],
        snapshots: snapRes.data || [],
        meta: detailRes.meta,
        error: null
      });
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'TIMEOUT') return;
      if (err.code === 'STOCK_SCHEMA_NOT_READY' || err.code === 'DATA_NOT_READY') {
        setState({ status: 'data_not_ready', instrument: null, latestBar: null, bars: [], snapshots: [], meta: null, error: err.message });
      } else {
        setState({ status: 'error', instrument: null, latestBar: null, bars: [], snapshots: [], meta: null, error: err.message || 'Error occurred' });
      }
    }
  }, [stockCode]);

  useEffect(() => {
    fetchDetail();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchDetail]);

  return {
    ...state,
    refetch: fetchDetail
  };
}
