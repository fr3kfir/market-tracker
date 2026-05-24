const RANGE_MAP = { '1W': '5D', '1M': '1M', '3M': '3M' };

export default function MiniChart({ ticker, range = '3M', height = 200 }) {
  const config = encodeURIComponent(JSON.stringify({
    symbol:        ticker,
    width:         '100%',
    height,
    locale:        'en',
    dateRange:     RANGE_MAP[range] ?? '3M',
    colorTheme:    'dark',
    isTransparent: true,
    autosize:      false,
    chartOnly:     false,
    noTimeScale:   false,
    largeChartUrl: '',
  }));

  return (
    <iframe
      key={`${ticker}-${range}`}
      title={`${ticker} chart`}
      src={`https://s.tradingview.com/embed-widget/mini-symbol-overview/?locale=en#${config}`}
      style={{
        width: '100%',
        height,
        border: 'none',
        display: 'block',
        borderRadius: 4,
      }}
      allowTransparency="true"
      loading="lazy"
    />
  );
}
