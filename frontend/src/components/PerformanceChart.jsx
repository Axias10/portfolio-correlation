import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';

const PALETTE = ['#22d3ee', '#10b981', '#f59e0b', '#a78bfa', '#ef4444', '#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#818cf8'];

export function PerformanceChart({ data }) {
  if (!data) return null;
  const tickers = Object.keys(data.series);
  const rows = data.dates.map((d, i) => {
    const row = { date: d };
    tickers.forEach((t) => (row[t] = data.series[t][i]));
    return row;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-[420px] w-full"
    >
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#1f2937' }}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#1f2937' }}
            domain={['dataMin - 5', 'dataMax + 5']}
            tickFormatter={(v) => v.toFixed(0)}
          />
          <Tooltip
            contentStyle={{
              background: '#0d1421',
              border: '1px solid #1f2937',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(v) => [v.toFixed(2), '']}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="circle"
          />
          {tickers.map((t, i) => (
            <Line
              key={t}
              type="monotone"
              dataKey={t}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={1.8}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationDuration={700}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
