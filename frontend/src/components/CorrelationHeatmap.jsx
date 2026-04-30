import { motion, AnimatePresence } from 'framer-motion';
import { corrColor } from '../lib/utils';

const abbr = (t) => (t.length > 6 ? t.slice(0, 5) + '…' : t);

export function CorrelationHeatmap({ data, pair, onCellClick }) {
  if (!data) return null;
  const { tickers, matrix } = data;
  const n = tickers.length;

  // Label column shrinks when many tickers
  const labelW = n > 12 ? 44 : 60;
  const gap = 2;

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="inline-grid w-full"
        style={{
          gridTemplateColumns: `${labelW}px repeat(${n}, 1fr)`,
          gap: `${gap}px`,
          minWidth: `${labelW + n * 24 + n * gap}px`,
        }}
      >
        {/* Header row */}
        <div />
        {tickers.map((t) => (
          <div
            key={`h-${t}`}
            title={t}
            className="pb-1 text-center font-mono uppercase text-slate-500"
            style={{ fontSize: n > 12 ? 8 : 10, lineHeight: '1' }}
          >
            {abbr(t)}
          </div>
        ))}

        {/* Data rows */}
        {tickers.map((row, i) => (
          <DataRow
            key={row}
            row={row}
            i={i}
            tickers={tickers}
            matrix={matrix}
            pair={pair}
            onCellClick={onCellClick}
            labelW={labelW}
            n={n}
          />
        ))}
      </div>

      {/* Pair selection hint */}
      <AnimatePresence>
        {pair.t1 && !pair.t2 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-center text-[10px] text-accent/70"
          >
            Cliquer sur un 2e actif pour comparer avec&nbsp;
            <span className="font-mono font-semibold text-accent">{pair.t1}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function DataRow({ row, i, tickers, matrix, pair, onCellClick, n }) {
  return (
    <>
      <div
        className="flex items-center justify-end pr-1 font-mono uppercase text-slate-500"
        title={row}
        style={{ fontSize: n > 12 ? 8 : 10 }}
      >
        {abbr(row)}
      </div>
      {matrix[i].map((v, j) => {
        const isDiag = i === j;
        const t2 = tickers[j];
        const isSelected =
          (pair.t1 === row && pair.t2 === t2) ||
          (pair.t1 === t2 && pair.t2 === row) ||
          (pair.t1 === row && !pair.t2) ||
          (pair.t1 === t2 && !pair.t2);

        return (
          <motion.div
            key={`${i}-${j}`}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (i + j) * 0.004, duration: 0.2 }}
            whileHover={!isDiag ? { scale: 1.12, zIndex: 10 } : {}}
            onClick={() => !isDiag && onCellClick(row, t2)}
            title={isDiag ? row : `${row} ↔ ${t2}: ${v.toFixed(3)}`}
            className="aspect-square rounded-sm border transition-all"
            style={{
              backgroundColor: corrColor(v),
              borderColor: isSelected ? 'rgba(34,211,238,0.8)' : 'rgba(255,255,255,0.04)',
              boxShadow: isSelected ? '0 0 0 1px rgba(34,211,238,0.4)' : 'none',
              cursor: isDiag ? 'default' : 'pointer',
            }}
          />
        );
      })}
    </>
  );
}
