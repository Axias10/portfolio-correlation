import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const WINDOWS = ['3M', '6M', '1Y', '5Y', '10Y'];

export function WindowFilter({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-bg-elevated p-1">
      {WINDOWS.map((w) => {
        const active = w === value;
        return (
          <button
            key={w}
            onClick={() => onChange(w)}
            className={cn(
              'relative rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors',
              active ? 'text-bg' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {active && (
              <motion.span
                layoutId="window-pill"
                className="absolute inset-0 rounded-md bg-accent"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{w}</span>
          </button>
        );
      })}
    </div>
  );
}
