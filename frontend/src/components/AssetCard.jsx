import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn, fmtPct, fmtPrice } from '../lib/utils';

export function AssetCard({ asset, index = 0, selected, onToggle }) {
  const up = asset.change_24h_pct >= 0;
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className={cn(
        'card group relative w-full overflow-hidden p-4 text-left transition-colors',
        selected ? 'ring-1 ring-accent/60 border-accent/40' : 'hover:border-border-strong',
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-sm font-semibold tracking-wider text-slate-100">
            {asset.ticker}
          </div>
          <div className="mt-0.5 text-[11px] uppercase tracking-widest text-slate-500">
            {asset.name}
          </div>
        </div>
        <span
          className={cn(
            'pill',
            up ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red',
          )}
        >
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {fmtPct(asset.change_24h_pct)}
        </span>
      </div>

      <div className="mt-4 font-mono text-2xl font-semibold text-white">
        {fmtPrice(asset.price)}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Activity size={11} className="text-accent" />
          Vol {asset.annual_volatility_pct.toFixed(1)}%
        </span>
        <span className={cn(asset.cumulative_return_pct >= 0 ? 'text-accent-green' : 'text-accent-red')}>
          Ret {fmtPct(asset.cumulative_return_pct, 1)}
        </span>
      </div>
    </motion.button>
  );
}
