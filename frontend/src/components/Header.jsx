import { Activity, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { WindowFilter } from './WindowFilter';

export function Header({ window, onWindow, onRefresh, isLoading }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Activity size={18} />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-white">
              PORTFOLIO CORRELATION
            </h1>
            <p className="text-[11px] text-slate-500">
              Real-time analytics · Pearson 12M rolling
            </p>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          <WindowFilter value={window} onChange={onWindow} />
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-border-strong hover:text-white"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>
    </header>
  );
}
