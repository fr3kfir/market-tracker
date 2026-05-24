// interval = candle size (what the user controls via the timeframe buttons)
// "1h" → 60-minute candles, "4h" → 240-minute candles, "1D" → daily, etc.
const INTERVAL_MAP = {
  '1h': '60',
  '4h': '240',
  '1D': 'D',
  '1W': 'W',
  '1M': 'M',
  // legacy keys (kept for backward compat)
  '5D': 'D',
  '3M': 'D',
  '6M': 'D',
  '1Y': 'W',
};

// How much price history to show for each candle timeframe
const DATERANGE_MAP = {
  '1h': '5D',
  '4h': '5D',
  '1D': '3M',
  '1W': '12M',
  '1M': '60M',
  // legacy keys
  '5D': '5D',
  '3M': '3M',
  '6M': '6M',
  '1Y': '12M',
};

/**
 * MiniChart — TradingView Advanced Chart (candlesticks + MA50 + MA200 + Volume)
 *
 * Props:
 *   ticker     – symbol, e.g. "AAPL"
 *   range      – "1D" | "5D" | "1M" | "3M" | "6M" | "1Y"
 *   height     – iframe height in px (default 370)
 *   advanced   – use advanced-chart widget (default true)
 *               false = fall back to mini-symbol-overview (line chart)
 */
export default function MiniChart({ ticker, range = '3M', height = 370, advanced = true }) {
  if (!advanced) {
    // Fallback: original mini price-line widget
    const miniConfig = encodeURIComponent(JSON.stringify({
      symbol: ticker, width: '100%', height,
      locale: 'en',
      dateRange: DATERANGE_MAP[range] ?? '3M',
      colorTheme: 'dark', isTransparent: true,
      autosize: false, chartOnly: false,
    }));
    return (
      <iframe
        key={`mini-${ticker}-${range}`}
        title={`${ticker} chart`}
        src={`https://s.tradingview.com/embed-widget/mini-symbol-overview/?locale=en#${miniConfig}`}
        style={{ width: '100%', height, border: 'none', display: 'block' }}
        allowTransparency="true"
        loading="lazy"
      />
    );
  }

  // Advanced chart — candlesticks, MA50, MA200, Volume
  const config = encodeURIComponent(JSON.stringify({
    symbol:              ticker,
    interval:            INTERVAL_MAP[range] ?? 'D',
    range:               DATERANGE_MAP[range] ?? '3M',
    timezone:            'America/New_York',
    theme:               'dark',
    style:               '1',          // 1 = Candlestick
    locale:              'en',
    withdateranges:      false,        // hide built-in range bar (we control it externally)
    hide_side_toolbar:   true,
    allow_symbol_change: false,
    save_image:          false,
    calendar:            false,
    hide_volume:         false,
    support_host:        'https://www.tradingview.com',
    // MA 50 + MA 200 as studies
    studies: [
      'MASimple@tv-basicstudies',      // MA 50
      'MASimple@tv-basicstudies',      // MA 200 (TV shows both if specified twice)
    ],
    studies_overrides: {
      'moving average.length': 50,
    },
    width:  '100%',
    height,
    autosize: false,
  }));

  return (
    <iframe
      key={`adv-${ticker}-${range}`}
      title={`${ticker} chart`}
      src={`https://s.tradingview.com/embed-widget/advanced-chart/?locale=en#${config}`}
      style={{
        width:   '100%',
        height,
        border:  'none',
        display: 'block',
      }}
      allowTransparency="true"
      loading="lazy"
    />
  );
}
