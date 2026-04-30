import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

import { Header } from './components/Header';
import { Section } from './components/Section';
import { AssetCard } from './components/AssetCard';
import { CorrelationHeatmap } from './components/CorrelationHeatmap';
import { PerformanceChart } from './components/PerformanceChart';
import { PairCorrelationPanel } from './components/PairCorrelationPanel';
import { useCorrelation, useNormalized, useSummary } from './hooks/usePortfolio';

export default function App() {
  const qc = useQueryClient();
  const [window, setWindow] = useState('1Y');
  const [selected, setSelected] = useState([]);
  const [pair, setPair] = useState({ t1: null, t2: null });
  const [rolling, setRolling] = useState(30);

  const summaryQ = useSummary(window);
  const corrQ = useCorrelation(window);
  const normQ = useNormalized(window, selected);

  useEffect(() => {
    if (summaryQ.data && selected.length === 0) {
      const top = [...summaryQ.data]
        .sort((a, b) => Math.abs(b.cumulative_return_pct) - Math.abs(a.cumulative_return_pct))
        .slice(0, 5)
        .map((a) => a.ticker);
      setSelected(top);
    }
  }, [summaryQ.data]); // eslint-disable-line

  const toggle = (ticker) => {
    setSelected((prev) =>
      prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker],
    );
  };

  const handleCellClick = (row, col) => {
    if (row === col) return;
    setPair((prev) => {
      // No selection → select first
      if (!prev.t1) return { t1: row, t2: null };
      // Same first cell clicked → deselect
      if (prev.t1 === row && !prev.t2) return { t1: null, t2: null };
      // Second cell clicked → complete the pair (normalize order)
      if (!prev.t2) return { t1: prev.t1, t2: row === prev.t1 ? col : row };
      // Already a pair → restart selection
      return { t1: row, t2: null };
    });
  };

  const clearPair = () => setPair({ t1: null, t2: null });

  const refreshAll = () => {
    qc.invalidateQueries();
    setPair({ t1: null, t2: null });
  };

  const isLoading = summaryQ.isFetching || corrQ.isFetching || normQ.isFetching;
  const errorMsg = useMemo(
    () => summaryQ.error?.message || corrQ.error?.message || null,
    [summaryQ.error, corrQ.error],
  );

  const showPairPanel = !!(pair.t1 && pair.t2);

  return (
    <div className="min-h-screen">
      <Header
        window={window}
        onWindow={setWindow}
        onRefresh={refreshAll}
        isLoading={isLoading}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-lg border border-accent-red/40 bg-accent-red/10 px-4 py-2 text-sm text-accent-red"
            >
              <AlertCircle size={16} />
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <Section
          title="Assets · Live"
          subtitle="Cliquer pour inclure/exclure du graphique de performance"
          delay={0.05}
        >
          {summaryQ.isLoading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {summaryQ.data?.map((a, i) => (
                <AssetCard
                  key={a.ticker}
                  asset={a}
                  index={i}
                  selected={selected.includes(a.ticker)}
                  onToggle={() => toggle(a.ticker)}
                />
              ))}
            </div>
          )}
        </Section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          {/* Correlation column */}
          <div className="xl:col-span-2">
            <Section
              title="Matrice de Corrélation"
              subtitle="Cliquer 2 cellules pour voir l'évolution temporelle"
              delay={0.1}
            >
              {corrQ.isLoading ? (
                <div className="h-72 animate-pulse rounded-md bg-bg-subtle" />
              ) : (
                <CorrelationHeatmap
                  data={corrQ.data}
                  pair={pair}
                  onCellClick={handleCellClick}
                />
              )}
              <Legend />
            </Section>

            {/* Pair panel slides in below the matrix */}
            <AnimatePresence>
              {showPairPanel && (
                <PairCorrelationPanel
                  ticker1={pair.t1}
                  ticker2={pair.t2}
                  window={window}
                  rolling={rolling}
                  onRollingChange={setRolling}
                  onClose={clearPair}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Performance chart column */}
          <div className="xl:col-span-3">
            <Section
              title="Performance Normalisée"
              subtitle={`Base 100 · ${selected.length} actif${selected.length === 1 ? '' : 's'} sélectionné${selected.length === 1 ? '' : 's'}`}
              delay={0.15}
            >
              {normQ.isLoading || !normQ.data ? (
                <div className="h-[420px] animate-pulse rounded-md bg-bg-subtle" />
              ) : (
                <PerformanceChart data={normQ.data} />
              )}
            </Section>
          </div>
        </div>

        <footer className="pt-4 text-center text-[11px] text-slate-600">
          Data : Yahoo Finance via yfinance · Tickers : Google Sheets · FastAPI + React
        </footer>
      </main>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500">
      <span>−1 inverse</span>
      <div
        className="mx-3 h-1.5 flex-1 rounded-full"
        style={{
          background:
            'linear-gradient(90deg, rgba(239,68,68,0.85), rgba(239,68,68,0.15), rgba(16,185,129,0.15), rgba(16,185,129,0.85))',
        }}
      />
      <span>+1 aligné</span>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 17 }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-bg-subtle" />
      ))}
    </div>
  );
}
