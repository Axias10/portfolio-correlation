# Portfolio Correlation Analytics

Real-time portfolio correlation dashboard — FastAPI backend + React/Vite frontend.

## Stack
- **Backend**: FastAPI · pandas · yfinance · gspread (Google Sheets)
- **Frontend**: React 18 · Vite · Tailwind · Framer Motion · Recharts · Radix UI · TanStack Query · Lucide

## Run

### Backend
```bash
cd backend
pip install -r requirements.txt
# (optional) export GOOGLE_SHEET_ID=... and place credentials.json
# cd c:\Users\Justin\Desktop\Justin\Code_projet\backend ; uvicorn main:app --reload --port 8000
uvicorn main:app --reload --port 8000
```

If no Google Sheet is configured, a default basket of tickers is used
(AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, JPM, GLD, TLT, BTC-USD).

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 — Vite proxies `/api/*` to the FastAPI backend.

## Endpoints
- `GET /api/health`
- `GET /api/tickers`
- `GET /api/summary?window=1Y` — price, 24h change, cumulative return, annual vol
- `GET /api/correlation?window=1Y` — Pearson matrix on daily returns
- `GET /api/normalized?window=1Y&tickers=AAPL,MSFT` — base-100 series

## Features
- Dark "Bloomberg/TradingView" aesthetic with Framer Motion transitions
- Cards: live price, 24h delta pill, vol & return
- Heatmap: hover any cell for exact ρ; diverging red↔green palette
- Normalized chart: toggle assets by clicking their cards
- Window filter: 3M / 6M / 1Y / 5Y with animated pill (`layoutId`)
- TanStack Query: caching, refetch button, smooth loading states

## Google Sheets setup (optional)
1. Create a service account, download `credentials.json` into `backend/`.
2. Share the sheet with the service-account email.
3. Put tickers in column A (one per row, header in row 1).
4. Set `GOOGLE_SHEET_ID` env var.
