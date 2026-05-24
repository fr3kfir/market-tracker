import { useState } from 'react';

const TABS = [
  { key: 'long',     label: 'Long',     color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { key: 'short',    label: 'Short',    color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  { key: 'universe', label: 'Universe', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
];

export const CLIP_COLORS = { long: '#34d399', short: '#f87171', universe: '#60a5fa' };
export const CLIP_BG     = { long: 'rgba(52,211,153,0.08)', short: 'rgba(248,113,113,0.08)', universe: 'rgba(96,165,250,0.08)' };

export default function ClipboardPanel({ clipboard, onRemove, onClear, onClose }) {
  const [activeTab, setActiveTab] = useState('long');
  const [copied, setCopied] = useState(false);

  const tickers = clipboard[activeTab] ?? [];
  const total = Object.values(clipboard).reduce((s, arr) => s + arr.length, 0);

  const handleCopy = () => {
    const text = tickers.map(t => t.ticker).join(',');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 280, zIndex: 200,
      background: 'var(--bg-panel)', borderLeft: '1px solid var(--border)',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>Clipboard</div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{total} stock{total !== 1 ? 's' : ''} selected</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4, fontSize: 18, lineHeight: 1 }}>×</button>
      </div>

      {/* Legend */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Click to classify</div>
        {[
          { dot: '#34d399', text: '1st click → Long (Bullish)' },
          { dot: '#f87171', text: '2nd click → Short (Bearish)' },
          { dot: '#60a5fa', text: '3rd click → Universe (Watching)' },
          { dot: 'var(--border)', text: '4th click → Remove' },
        ].map(({ dot, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {TABS.map(tab => {
          const count = (clipboard[tab.key] ?? []).length;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '9px 4px', border: 'none', cursor: 'pointer',
                background: isActive ? tab.bg : 'transparent',
                color: isActive ? tab.color : 'var(--text-faint)',
                fontSize: 12, fontWeight: isActive ? 700 : 400, fontFamily: 'inherit',
                borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                transition: 'all 0.12s',
              }}
            >
              {tab.label} {count > 0 && (
                <span style={{ background: tab.color, color: '#000', borderRadius: 8, padding: '1px 5px', fontSize: 10, fontWeight: 700, marginLeft: 3 }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Ticker list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {tickers.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 12, fontFamily: 'monospace' }}>
            No stocks in {activeTab} list
          </div>
        ) : (
          tickers.map(({ ticker, name }) => {
            const tab = TABS.find(t => t.key === activeTab);
            return (
              <div
                key={ticker}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: tab.color, fontFamily: 'monospace' }}>{ticker}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 1, maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                </div>
                <button
                  onClick={() => onRemove(activeTab, ticker)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4, fontSize: 16, lineHeight: 1 }}
                >×</button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleCopy}
          disabled={tickers.length === 0}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '9px', borderRadius: 8, border: '1px solid var(--border)',
            cursor: tickers.length === 0 ? 'not-allowed' : 'pointer',
            background: copied ? 'rgba(52,211,153,0.1)' : 'var(--bg)',
            color: copied ? '#34d399' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
            opacity: tickers.length === 0 ? 0.4 : 1, transition: 'all 0.15s',
          }}
        >
          {copied ? '✓ Copied!' : `Copy ${activeTab} tickers`}
        </button>
        <button
          onClick={() => onClear(activeTab)}
          disabled={tickers.length === 0}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '9px', borderRadius: 8, border: '1px solid var(--border)',
            cursor: tickers.length === 0 ? 'not-allowed' : 'pointer',
            background: 'var(--bg)', color: '#f87171',
            fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
            opacity: tickers.length === 0 ? 0.4 : 1,
          }}
        >
          ✕ Clear {activeTab}
        </button>
      </div>
    </div>
  );
}
