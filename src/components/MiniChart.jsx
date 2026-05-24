const RANGE_MAP = {
  '1D': '1D',
  '5D': '5D',
  '1W': '5D',
  '1M': '1M',
  '3M': '3M',
  '6M': '6M',
  '1Y': '12M',
};

export default function MiniChart({ ticker, range = '3M', height = 200, chartOnly = false }) {
  const config = encodeURIComponent(JSON.stringify({
    symbol:        ticker,
    width:         '100%',
    height,
    locale:        'en',
    dateRange:     RANGE_MAP[range] ?? '3M',
    colorTheme:    'dark',
    isTransparent: true,
    autosize:      false,
    chartOnly,
    noTimeScale:   false,
    largeChartUrl: '',
  }));

  return (
    <iframe
      key={`${ticker}-${range}-${chartOnly}`}
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
