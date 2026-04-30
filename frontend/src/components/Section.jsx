import { motion } from 'framer-motion';

export function Section({ title, subtitle, action, children, delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="card p-5"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  );
}
