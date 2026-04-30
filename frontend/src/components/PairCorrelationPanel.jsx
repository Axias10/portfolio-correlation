import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { cn } from '../lib/utils';
import { usePairCorrelation } from '../hooks/usePortfolio';

const ROLLING_OPTIONS = [
  { value: 14, label: '14j' },
  { value: 30, label: '30j' },
  { value: 60, label: '60j' },
  { value: 90, label: '90j' },
  { value: 180, label: '6M' },
  { value: 252, label: '1Y' },
  { value: 504, label: '2Y' },
  { value: 1260, label: '5Y' },
];

export function PairCorrelationPanel({ ticker1, ticker2, window, rolling, onRollingChange, onClose }) {
  const { data, isLoading } = usePairCorrelation(ticker1, ticker2, window, rolling);

  const cur = data?.current;
  const trendIcon =
    cur == null ? <Minus size={14} /> :
    cur > 0.3 ? <TrendingUp size={14} /> :
    cur < -0.3 ? <TrendingDown size={14} /> :
    <Minus size={14} />;

  const curColor =
    cur == null ? 'text-slate-400' :
    cur >= 0 ? 'text-accent-green' : 'text-accent-red';

  const rows = data?.dates.map((d, i) => ({ date: d, value: data.values[i] })) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="card mt-4 p-5"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-white">{ticker1}</span>
            <span className="text-slate-500">↔</span>
            <span className="font-mono text-sm font-bold text-white">{ticker2}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            Corrélation roulante Pearson · fenêtre {rolling} jours bourse
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Rolling selector */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-bg p-1">
            {ROLLING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onRollingChange(opt.value)}
                className={cn(
                  'rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
                  rolling === opt.value
                    ? 'bg-accent/20 text-accent'
                    : 'text-slate-500 hover:text-slate-200',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Current ρ badge */}
          {cur != null && (
            <div className={cn('flex items-center gap-1 font-mono text-xl font-bold', curColor)}>
              {trendIcon}
              {cur.toFixed(3)}
            </div>
          )}

          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 transition-colors hover:bg-bg-subtle hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-48 animate-pulse rounded-md bg-bg-subtle" />
      ) : (
        <div className="h-48">
          <ResponsiveContainer>
            <AreaChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="corrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
              <ReferenceLine y={0} stroke="#374151" strokeDasharray="4 2" />
              <ReferenceLine y={0.5} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.4} />
              <ReferenceLine y={-0.5} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.4} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#475569', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                minTickGap={60}
              />
              <YAxis
                domain={[-1, 1]}
                ticks={[-1, -0.5, 0, 0.5, 1]}
                tick={{ fill: '#475569', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#0d1421',
                  border: '1px solid #1f2937',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#64748b' }}
                formatter={(v) => [v.toFixed(3), 'ρ']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22d3ee"
                strokeWidth={1.5}
                fill="url(#corrGrad)"
                dot={false}
                isAnimationActive
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Interpretation */}
      {cur != null && (
        <div className="mt-3 flex justify-end">
          <span className="rounded-md bg-bg-subtle px-2 py-1 text-[11px] text-slate-400">
            {Math.abs(cur) > 0.7 ? '🔴 Forte corrélation' :
             Math.abs(cur) > 0.4 ? '🟡 Corrélation modérée' :
             '🟢 Faible corrélation'}
            &nbsp;·&nbsp;
            {cur > 0 ? 'sens identique' : 'sens opposé'}
          </span>
        </div>
      )}
    </motion.div>
  );
}
