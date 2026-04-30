import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useSummary(window) {
  return useQuery({
    queryKey: ['summary', window],
    queryFn: () => api.summary(window),
  });
}

export function useCorrelation(window) {
  return useQuery({
    queryKey: ['correlation', window],
    queryFn: () => api.correlation(window),
  });
}

export function useNormalized(window, tickers) {
  return useQuery({
    queryKey: ['normalized', window, tickers?.join(',')],
    queryFn: () => api.normalized(window, tickers),
    enabled: !!tickers && tickers.length > 0,
  });
}

export function usePairCorrelation(ticker1, ticker2, window, rolling = 30) {
  return useQuery({
    queryKey: ['pair-corr', ticker1, ticker2, window, rolling],
    queryFn: () => api.correlationPair(ticker1, ticker2, window, rolling),
    enabled: !!ticker1 && !!ticker2 && ticker1 !== ticker2,
  });
}
