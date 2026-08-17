const API_BASE = '/api/stock';

const getStockDataMode = () => {
  return import.meta.env.VITE_STOCK_DATA_MODE === 'mock' ? 'mock' : 'api';
};

class StockApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function fetchApi(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });

    clearTimeout(timeoutId);

    if (res.status === 204) return null;

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new StockApiError('Invalid response format', res.status, 'INVALID_FORMAT');
    }

    const data = await res.json();
    
    if (!res.ok) {
      if (data.meta?.status === 'DATA_NOT_READY') {
        throw new StockApiError(data.error?.message || 'Data Not Ready', res.status, data.error?.code || 'DATA_NOT_READY');
      }
      throw new StockApiError(data.error?.message || 'API Error', res.status, data.error?.code || 'UNKNOWN');
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new StockApiError('Request Timeout', 408, 'TIMEOUT');
    }
    throw err;
  }
}

export const getStockHealth = async (signal) => {
  if (getStockDataMode() === 'mock') return { meta: { status: 'OK' }, data: { apiStatus: 'OK' } };
  return fetchApi('/health', { signal });
};

export const searchStocks = async (params = {}, signal) => {
  if (getStockDataMode() === 'mock') {
    // Return dummy data in mock mode
    return {
      data: [{ stock_code: '005930', instrument_name: '삼성전자', market_code: 'KRX_KOSPI' }],
      meta: { status: 'OK', asOfAt: new Date().toISOString(), sources: ['MOCK'] }
    };
  }
  
  const query = new URLSearchParams();
  if (params.q) query.append('q', params.q);
  if (params.market) query.append('market', params.market);
  if (params.page) query.append('page', params.page);
  
  return fetchApi(`/instruments?${query.toString()}`, { signal });
};

export const getStockDetail = async (stockCode, signal) => {
  if (getStockDataMode() === 'mock') {
    return {
      data: {
        instrument: { stock_code: stockCode, instrument_name: '삼성전자', market_code: 'KRX_KOSPI' },
        latestBar: { close_price: '80000', trade_date: '2026-08-14' }
      },
      meta: { status: 'OK', isFinal: true, sources: ['MOCK'] }
    };
  }
  return fetchApi(`/instruments/${stockCode}`, { signal });
};

export const getStockDailyBars = async (stockCode, params = {}, signal) => {
  if (getStockDataMode() === 'mock') {
    return {
      data: [{ trade_date: '2026-08-14', close_price: '80000', open_price: '79000', high_price: '81000', low_price: '78000', volume: '1000000' }],
      meta: { status: 'OK', sources: ['MOCK'] }
    };
  }
  const query = new URLSearchParams();
  if (params.venue) query.append('venue', params.venue);
  return fetchApi(`/instruments/${stockCode}/daily-bars?${query.toString()}`, { signal });
};

export const getStockSnapshots = async (stockCode, signal) => {
  if (getStockDataMode() === 'mock') {
    return { data: [], meta: { status: 'OK', sources: ['MOCK'] } };
  }
  return fetchApi(`/instruments/${stockCode}/snapshots`, { signal });
};

export const getKoreaMarketLatest = async (signal) => {
  if (getStockDataMode() === 'mock') {
    return {
      data: { kospi: '2800.50', kosdaq: '850.20', latestTradeDate: '2026-08-14' },
      meta: { status: 'OK', isFinal: true, sources: ['MOCK'] }
    };
  }
  return fetchApi('/markets/korea/latest', { signal });
};

export const isMockMode = () => getStockDataMode() === 'mock';
