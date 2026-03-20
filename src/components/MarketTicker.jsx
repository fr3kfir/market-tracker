import { useState, useEffect } from 'react';

const TICKER_ETFS = ['SPY','QQQ','DIA','IWM','GLD','USO','TLT','UUP','IBIT','UNL','^VIX'];

const LABELS = {
  SPY: 'S&P 500', QQQ: 'Nasdaq', DIA: 'Dow Jones', IWM: 'Russell 2K',
  GLD: 'Gold', USO: 'Oil', TLT: 'Bonds 20Y', UUP: 'US Dollar',
  IBIT: 'Bitcoin ETF', UNL: 'Nat Gas', '^VIX': 'VIX',
};

export default function MarketTicker() {
  const [quotes, setQuotes] = useState([]);
  const [flash, setFlash] = useState({});

  const fetchTicker = async () => {
    try {
      const r = await fetch(`/api/quotes?symbols=${TICKER_ETFS.join(',')}`);
      const d = await r.json();
      const newQuotes = d?.quoteResponse?.result || [];
      setQuotes(prev => {
        const flashMap = {};
        newQuotes.forEach(q => {
          const old = prev.find(p => p.symbol === q.symbol);
          if (old && old.regularMarketPrice !== q.regularMarketPrice) {
            flashMap[q.symbol] = q.regularMarketPrice > old.regularMarketPrice ? 'up' : 'down';
          }
        });
        if (Object.keys(flashMap).length) {
          setFlash(flashMap);
          setTimeout(() => setFlash({}), 1500);
        }
        return newQuotes;
      });
    } catch {}
  };

  useEffect(() => {
    fetchTicker();
    const id = setInterval(fetchTicker, 30000);
    return () => clearInterval(id);
  }, []);

  if (!quotes.length) return null;

  const items = [...quotes, ...quotes]; // duplicate for seamless loop

  return (
    <div className="border-b overflow-hidden" style={{ background: '#060910', borderColor: '#1a2540' }}>
      <div className="ticker-track">
        {items.map((q, i) => {
          const isPos = q.regularMarketChangePercent >= 0;
          const flashType = flash[q.symbol];
          return (
            <div
              key={i}
              className="flex items-center gap-2 px-5 py-1.5 border-r"
              style={{ borderColor: '#1a2540', minWidth: 'max-content' }}
            >
              <span className="text-xs font-bold font-mono text-white tracking-wide">
                {LABELS[q.symbol] || q.symbol}
              </span>
              <span
                className="text-xs font-mono font-semibold transition-colors duration-500"
                style={{
                  color: flashType === 'up' ? '#34d399' : flashType === 'down' ? '#f87171' : '#c8d0e0'
                }}
              >
                {q.symbol === '^VIX'
                  ? q.regularMarketPrice?.toFixed(2)
                  : `$${q.regularMarketPrice?.toFixed(2)}`}
              </span>
              <span
                className="text-xs font-mono font-bold"
                style={{ color: isPos ? '#38bdf8' : '#f472b6' }}
              >
                {isPos ? '▲' : '▼'} {Math.abs(q.regularMarketChangePercent)?.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
