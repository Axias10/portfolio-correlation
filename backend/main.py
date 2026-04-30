"""
Portfolio Correlation Analytics API
FastAPI backend bridging Google Sheets + Yahoo Finance to a React frontend.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Literal

import numpy as np
import pandas as pd
import yfinance as yf
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    import gspread
    from google.oauth2.service_account import Credentials
    GSPREAD_AVAILABLE = True
except ImportError:
    GSPREAD_AVAILABLE = False

# --- Config ---------------------------------------------------------------
DEFAULT_TICKERS = ["BZ=F", "GC=F", "^GSPC", "EEM", "JMT.PA", "MC.PA", "BN.PA", "AI.PA", "IPN.PA", "TTE.PA", "RI.PA", "TEP.PA", "SW.PA", "OR.PA", "STMPA.PA", "BTC-USD", "EWY"]
GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID", "")
GOOGLE_CREDS_PATH = os.getenv("GOOGLE_CREDS_PATH", "credentials.json")
SHEET_RANGE = os.getenv("SHEET_RANGE", "A:A")

WINDOWS = {
    "3M": 90,
    "6M": 180,
    "1Y": 365,
    "5Y": 365 * 5,
}

app = FastAPI(title="Portfolio Correlation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Models ---------------------------------------------------------------

class AssetSummary(BaseModel):
    ticker: str
    name: str
    price: float
    change_24h_pct: float
    cumulative_return_pct: float
    annual_volatility_pct: float


class CorrelationResponse(BaseModel):
    tickers: list[str]
    matrix: list[list[float]]
    window: str
    as_of: str


class NormalizedSeriesResponse(BaseModel):
    dates: list[str]
    series: dict[str, list[float]]
    window: str


# --- Tickers source -------------------------------------------------------

def load_tickers_from_sheet() -> list[str]:
    """Read tickers from a Google Sheet. Falls back to DEFAULT_TICKERS."""
    if not (GSPREAD_AVAILABLE and GOOGLE_SHEET_ID and os.path.exists(GOOGLE_CREDS_PATH)):
        return DEFAULT_TICKERS
    try:
        scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
        creds = Credentials.from_service_account_file(GOOGLE_CREDS_PATH, scopes=scopes)
        client = gspread.authorize(creds)
        sheet = client.open_by_key(GOOGLE_SHEET_ID).sheet1
        col = sheet.col_values(1)
        tickers = [t.strip().upper() for t in col[1:] if t.strip()]
        return tickers or DEFAULT_TICKERS
    except Exception:
        return DEFAULT_TICKERS


# --- Data layer -----------------------------------------------------------

@lru_cache(maxsize=8)
def _fetch_history(tickers_key: str, period_days: int) -> pd.DataFrame:
    """Fetch adjusted close history. Cached by tickers+window."""
    tickers = tickers_key.split(",")
    end = datetime.utcnow()
    start = end - timedelta(days=period_days + 5)
    data = yf.download(
        tickers,
        start=start.strftime("%Y-%m-%d"),
        end=end.strftime("%Y-%m-%d"),
        auto_adjust=True,
        progress=False,
        group_by="ticker",
        threads=True,
    )
    if data.empty:
        raise HTTPException(503, "No data returned from Yahoo Finance.")

    if isinstance(data.columns, pd.MultiIndex):
        closes = pd.DataFrame({t: data[t]["Close"] for t in tickers if t in data.columns.get_level_values(0)})
    else:
        closes = data[["Close"]].rename(columns={"Close": tickers[0]})
    return closes.dropna(how="all").ffill()


def get_closes(tickers: list[str], window: str) -> pd.DataFrame:
    days = WINDOWS.get(window, 365)
    key = ",".join(sorted(tickers))
    df = _fetch_history(key, days).copy()
    return df.tail(days)


# --- Routes ---------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


@app.get("/api/tickers")
def tickers():
    return {"tickers": load_tickers_from_sheet()}


@app.get("/api/summary", response_model=list[AssetSummary])
def summary(window: str = Query("1Y")):
    tickers = load_tickers_from_sheet()
    closes = get_closes(tickers, window)
    if closes.empty:
        raise HTTPException(503, "No price data available.")

    out: list[AssetSummary] = []
    returns = closes.pct_change().dropna(how="all")
    for t in closes.columns:
        s = closes[t].dropna()
        if len(s) < 2:
            continue
        price = float(s.iloc[-1])
        prev = float(s.iloc[-2])
        change_24h = (price / prev - 1) * 100 if prev else 0.0
        cum_ret = (price / float(s.iloc[0]) - 1) * 100
        vol = float(returns[t].std() * np.sqrt(252) * 100) if t in returns else 0.0
        out.append(AssetSummary(
            ticker=t,
            name=t,
            price=round(price, 2),
            change_24h_pct=round(change_24h, 2),
            cumulative_return_pct=round(cum_ret, 2),
            annual_volatility_pct=round(vol, 2),
        ))
    return out


@app.get("/api/correlation", response_model=CorrelationResponse)
def correlation(window: str = Query("1Y")):
    tickers = load_tickers_from_sheet()
    closes = get_closes(tickers, window)
    rets = closes.pct_change().dropna(how="all")
    corr = rets.corr(method="pearson").fillna(0.0)
    return CorrelationResponse(
        tickers=list(corr.columns),
        matrix=corr.round(4).values.tolist(),
        window=window,
        as_of=datetime.utcnow().isoformat(),
    )


@app.get("/api/normalized", response_model=NormalizedSeriesResponse)
def normalized(
    window: str = Query("1Y"),
    tickers: str | None = Query(None, description="Comma-separated subset"),
):
    all_tickers = load_tickers_from_sheet()
    selected = [t.strip().upper() for t in tickers.split(",")] if tickers else all_tickers
    selected = [t for t in selected if t in all_tickers] or all_tickers

    closes = get_closes(all_tickers, window)[selected].dropna(how="all").ffill()
    if closes.empty:
        raise HTTPException(503, "No data for selected tickers.")

    base = closes.iloc[0]
    norm = (closes / base) * 100.0
    return NormalizedSeriesResponse(
        dates=[d.strftime("%Y-%m-%d") for d in norm.index],
        series={t: norm[t].round(2).tolist() for t in norm.columns},
        window=window,
    )


class PairCorrelationResponse(BaseModel):
    ticker1: str
    ticker2: str
    window: str
    rolling: int
    dates: list[str]
    values: list[float]
    current: float | None


@app.get("/api/correlation-pair", response_model=PairCorrelationResponse)
def correlation_pair(
    ticker1: str = Query(...),
    ticker2: str = Query(...),
    window: str = Query("1Y"),
    rolling: int = Query(30, ge=5, le=120),
):
    all_tickers = load_tickers_from_sheet()
    if ticker1 not in all_tickers or ticker2 not in all_tickers:
        raise HTTPException(400, f"Unknown ticker(s): {ticker1}, {ticker2}")

    closes = get_closes(all_tickers, window)
    pair = closes[[ticker1, ticker2]].dropna()
    if len(pair) < rolling + 1:
        raise HTTPException(400, "Not enough data for the requested rolling window.")

    rets = pair.pct_change().dropna()
    roll = rets[ticker1].rolling(rolling).corr(rets[ticker2]).dropna()

    return PairCorrelationResponse(
        ticker1=ticker1,
        ticker2=ticker2,
        window=window,
        rolling=rolling,
        dates=[d.strftime("%Y-%m-%d") for d in roll.index],
        values=roll.round(4).tolist(),
        current=round(float(roll.iloc[-1]), 4) if len(roll) else None,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
