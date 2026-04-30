const BASE = import.meta.env.VITE_API_URL || '';

async function http(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export const api = {
  health: () => http('/api/health'),
  tickers: () => http('/api/tickers'),
  summary: (window) => http(`/api/summary?window=${window}`),
  correlation: (window) => http(`/api/correlation?window=${window}`),
  normalized: (window, tickers) => {
    const q = tickers?.length ? `&tickers=${tickers.join(',')}` : '';
    return http(`/api/normalized?window=${window}${q}`);
  },
  correlationPair: (ticker1, ticker2, window, rolling = 30) =>
    http(`/api/correlation-pair?ticker1=${ticker1}&ticker2=${ticker2}&window=${window}&rolling=${rolling}`),
};
