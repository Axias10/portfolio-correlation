import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';

import { Section } from './Section';
import { cn, fmtPct } from '../lib/utils';

function createInitialWeights(assets) {
  if (!assets.length) return {};
  const equal = 100 / assets.length;
  return Object.fromEntries(assets.map((asset) => [asset.ticker, Number(equal.toFixed(2))]));
}

function normalizeWeights(weights, assets) {
  if (!assets.length) return {};

  const total = assets.reduce((sum, asset) => sum + Math.max(0, Number(weights[asset.ticker] ?? 0)), 0);
  if (total <= 0) {
    return Object.fromEntries(assets.map((asset) => [asset.ticker, 0]));
  }

  return Object.fromEntries(
    assets.map((asset) => [
      asset.ticker,
      Math.max(0, Number(weights[asset.ticker] ?? 0)) / total,
    ]),
  );
}

function buildCorrLookup(corrData) {
  if (!corrData) return { index: new Map(), matrix: [] };

  const index = new Map(corrData.tickers.map((ticker, i) => [ticker, i]));
  return { index, matrix: corrData.matrix };
}

function getCorrelation(corrData, tickerA, tickerB) {
  if (!corrData || !tickerA || !tickerB) return 0;
  const { index, matrix } = buildCorrLookup(corrData);
  const row = index.get(tickerA);
  const col = index.get(tickerB);
  if (row == null || col == null) return 0;
  return Number(matrix[row]?.[col] ?? 0);
}

export function PortfolioRiskPanel({ summaryData, corrData }) {
  const assets = summaryData ?? [];
  const [weights, setWeights] = useState(() => createInitialWeights(assets));
  const [hasUserEdited, setHasUserEdited] = useState(false);

  useEffect(() => {
    setWeights((current) => {
      const next = { ...current };
      let changed = false;

      for (const asset of assets) {
        if (next[asset.ticker] == null) {
          next[asset.ticker] = 100 / Math.max(assets.length, 1);
          changed = true;
        }
      }

      if (!changed) return current;
      return next;
    });
  }, [assets]);

  const normalized = useMemo(() => normalizeWeights(weights, assets), [weights, assets]);

  const totalWeight = assets.reduce((sum, asset) => sum + Number(weights[asset.ticker] ?? 0), 0);
  const marketAsset = assets.find((asset) => asset.ticker === '^GSPC');

  const portfolioMetrics = useMemo(() => {
    const corrLookup = buildCorrLookup(corrData);
    const tickerVols = new Map(
      assets.map((asset) => [asset.ticker, Math.max(0, asset.annual_volatility_pct / 100)]),
    );

    let variance = 0;
    let weightedCorrelationSum = 0;
    let weightedCorrelationWeight = 0;
    const hotspotCandidates = [];

    for (let i = 0; i < assets.length; i += 1) {
      const assetA = assets[i];
      const wa = normalized[assetA.ticker] || 0;
      const vola = tickerVols.get(assetA.ticker) || 0;

      variance += wa * wa * vola * vola;

      for (let j = i + 1; j < assets.length; j += 1) {
        const assetB = assets[j];
        const wb = normalized[assetB.ticker] || 0;
        const volb = tickerVols.get(assetB.ticker) || 0;
        const corr = corrLookup.index.size ? getCorrelation(corrData, assetA.ticker, assetB.ticker) : 0;

        variance += 2 * wa * wb * vola * volb * corr;
        const pairWeight = wa * wb;
        weightedCorrelationWeight += pairWeight;
        weightedCorrelationSum += pairWeight * Math.abs(corr);

        if (Math.abs(corr) >= 0.65 && pairWeight >= 0.015) {
          hotspotCandidates.push({
            a: assetA.ticker,
            b: assetB.ticker,
            corr,
            exposure: pairWeight,
          });
        }
      }
    }

    const portfolioVolatility = Math.max(0, Math.sqrt(Math.max(variance, 0)));
    const averageWeightedCorr = weightedCorrelationWeight
      ? weightedCorrelationSum / weightedCorrelationWeight
      : 0;

    let beta = null;
    if (marketAsset) {
      const marketVol = Math.max(0, marketAsset.annual_volatility_pct / 100);
      const betaSum = assets.reduce((sum, asset) => {
        const weight = normalized[asset.ticker] || 0;
        const corrToMarket = getCorrelation(corrData, asset.ticker, '^GSPC');
        const assetVol = tickerVols.get(asset.ticker) || 0;
        if (!marketVol || !assetVol) return sum;
        return sum + weight * corrToMarket * (assetVol / marketVol);
      }, 0);
      beta = Number(betaSum.toFixed(3));
    }

    const topTwoWeight = assets
      .map((asset) => ({ ticker: asset.ticker, weight: normalized[asset.ticker] || 0 }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 2)
      .reduce((sum, item) => sum + item.weight, 0);

    return {
      portfolioVolatility,
      averageWeightedCorr,
      beta,
      topTwoWeight,
      hotspots: hotspotCandidates
        .sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr) || b.exposure - a.exposure)
        .slice(0, 4),
    };
  }, [assets, corrData, marketAsset, normalized]);

  const handleWeightChange = (ticker, value) => {
    const next = Number(value);
    setHasUserEdited(true);
    setWeights((current) => ({
      ...current,
      [ticker]: Number.isFinite(next) ? Math.max(0, Math.min(100, next)) : 0,
    }));
  };

  const resetWeights = () => {
    setHasUserEdited(false);
    setWeights(createInitialWeights(assets));
  };

  const hasMismatch = Math.abs(totalWeight - 100) > 1;

  return (
    <Section
      title="Pondération & exposition au risque"
      subtitle="Définis les poids de ton portefeuille, puis vois la volatilité estimée, le beta et les corrélations les plus critiques"
      delay={0.2}
      action={
        <button
          type="button"
          onClick={resetWeights}
          className="rounded-md border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-slate-300 transition hover:border-accent/50 hover:text-white"
        >
          Réinitialiser
        </button>
      }
    >
      {!assets.length || !corrData ? (
        <div className="h-40 animate-pulse rounded-xl bg-bg-subtle" />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[1.05fr_1.3fr]">
            <div className="space-y-3">
              {assets.map((asset) => {
                const currentWeight = Number(weights[asset.ticker] ?? 0);
                const normalizedWeight = normalized[asset.ticker] || 0;
                const badge = currentWeight > 0 ? `${currentWeight.toFixed(1)}%` : '0%';

                return (
                  <div key={asset.ticker} className="rounded-xl border border-border bg-bg-subtle/80 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-mono text-sm font-semibold text-white">{asset.ticker}</div>
                        <div className="text-[11px] text-slate-500">Volatilité annuelle : {fmtPct(asset.annual_volatility_pct)}</div>
                      </div>
                      <span className="rounded-full border border-border px-2 py-1 text-[11px] text-slate-200">
                        {badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={currentWeight}
                        onChange={(event) => handleWeightChange(asset.ticker, event.target.value)}
                        className="h-1 w-full cursor-pointer accent-cyan-400"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={currentWeight.toFixed(0)}
                        onChange={(event) => handleWeightChange(asset.ticker, event.target.value)}
                        className="w-20 rounded-md border border-border bg-bg px-2 py-1 text-right text-sm text-white outline-none"
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Contribution normalisée : {(normalizedWeight * 100).toFixed(1)}%</span>
                      <span>{corrData ? 'corrélation active' : 'chargement…'}</span>
                    </div>
                  </div>
                );
              })}

              <div className={cn(
                'rounded-xl border px-3 py-3 text-sm',
                hasMismatch
                  ? 'border-accent-red/40 bg-accent-red/10 text-accent-red'
                  : 'border-border bg-bg-subtle/80 text-slate-200',
              )}>
                <div className="flex items-center justify-between gap-3">
                  <span>Poids total</span>
                  <span className="font-semibold">{totalWeight.toFixed(1)}%</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  {hasMismatch
                    ? 'Les poids ne sont pas à 100%. Les calculs utilisent une normalisation automatique.'
                    : 'Les poids sont alignés à 100%.'}
                </p>
                {hasUserEdited && !hasMismatch && (
                  <p className="mt-2 text-[11px] text-slate-400">Les métriques utilisent la somme normalisée de ton portefeuille.</p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Volatilité estimée"
                value={fmtPct(portfolioMetrics.portfolioVolatility * 100)}
                footnote="Basée sur les volatilities annuelles et les corrélations du jeu de données"
                icon={<ShieldCheck size={16} className="text-cyan-300" />}
              />
              <MetricCard
                label="Beta portefeuille"
                value={portfolioMetrics.beta == null ? '—' : portfolioMetrics.beta.toFixed(3)}
                footnote={portfolioMetrics.beta == null ? 'Ajoute ^GSPC pour calculer un beta exploitable' : 'Beta vs ^GSPC'}
                icon={<Sparkles size={16} className="text-amber-300" />}
              />
              <MetricCard
                label="Corrélation pondérée"
                value={portfolioMetrics.averageWeightedCorr.toFixed(2)}
                footnote="Plus le score est haut, plus ton portefeuille est “concentré” sur des actifs similaires"
                icon={<Sparkles size={16} className="text-fuchsia-300" />}
              />
              <MetricCard
                label="Concentration top 2"
                value={`${(portfolioMetrics.topTwoWeight * 100).toFixed(1)}%`}
                footnote="Poids cumulé des deux actifs les plus importants"
                icon={<AlertTriangle size={16} className="text-rose-300" />}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-bg-subtle/80 p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-300" />
              <h3 className="text-sm font-semibold text-white">Hotspots de corrélation</h3>
            </div>

            {portfolioMetrics.hotspots.length === 0 ? (
              <p className="text-sm text-slate-400">
                Aucune corrélation critique détectée à ce stade. Ton portefeuille paraît bien diversifié.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {portfolioMetrics.hotspots.map((spot) => (
                  <div key={`${spot.a}-${spot.b}`} className="rounded-lg border border-border bg-bg px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm text-white">{spot.a} · {spot.b}</span>
                      <span className={cn('text-sm font-semibold', spot.corr >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                        {spot.corr.toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Exposition combinée : {(spot.exposure * 100).toFixed(1)}% du portefeuille
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}

function MetricCard({ label, value, footnote, icon }) {
  return (
    <div className="rounded-xl border border-border bg-bg-subtle/80 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</span>
        {icon}
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      <p className="mt-2 text-[11px] leading-5 text-slate-400">{footnote}</p>
    </div>
  );
}