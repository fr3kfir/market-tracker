// New 52-week highs vs lows — daily counts across the tracked universe.
// A stock makes a new 52-week high on day d when its intraday high exceeds the
// highest high of the previous 251 sessions (lows mirror this).
const BATCH = 80;
const LOOKBACK = 251;   // prior sessions → 52-week window incl. today
const MIN_PRIOR = 200;  // skip young listings without ~a year of history
const DAYS = 252;       // how many trading days to chart

async function fetchHistoryBatch(symbols) {
  try {
    const r = await fetch(`/api/history?symbols=${symbols.join(',')}&range=2y`);
    if (!r.ok) return {};
    return await r.json();
  } catch { return {}; }
}

export async function fetchHighLowHistory(allSymbols) {
  const batches = [];
  for (let i = 0; i < allSymbols.length; i += BATCH)
    batches.push(allSymbols.slice(i, i + BATCH));

  const results = await Promise.allSettled(batches.map(fetchHistoryBatch));
  const historyMap = {};
  results.forEach(r => { if (r.status === 'fulfilled') Object.assign(historyMap, r.value); });

  // Normalize to calendar dates so feeds with slightly different timestamps align
  const dayKey = t => new Date(t * 1000).toISOString().slice(0, 10);
  const daySet = new Set();
  Object.values(historyMap).forEach(h => h?.timestamps?.forEach(t => daySet.add(dayKey(t))));
  const days = [...daySet].sort();
  const N = days.length;
  if (N <= LOOKBACK) return [];
  const dayIdx = new Map(days.map((d, i) => [d, i]));

  const start = Math.max(LOOKBACK, N - DAYS);
  const rows = days.slice(start).map(date => ({ date, highs: 0, lows: 0, highTickers: [], lowTickers: [], total: 0 }));

  for (const [sym, h] of Object.entries(historyMap)) {
    if (!h?.timestamps?.length) continue;
    const hi = new Array(N).fill(null);
    const lo = new Array(N).fill(null);
    h.timestamps.forEach((t, i) => {
      const di = dayIdx.get(dayKey(t));
      hi[di] = h.highs?.[i] ?? h.closes?.[i] ?? null;
      lo[di] = h.lows?.[i]  ?? h.closes?.[i] ?? null;
    });

    for (let di = start; di < N; di++) {
      if (hi[di] == null || lo[di] == null) continue;
      let maxH = -Infinity, minL = Infinity, cnt = 0;
      for (let k = di - LOOKBACK; k < di; k++) {
        if (hi[k] == null || lo[k] == null) continue;
        cnt++;
        if (hi[k] > maxH) maxH = hi[k];
        if (lo[k] < minL) minL = lo[k];
      }
      if (cnt < MIN_PRIOR) continue;
      const row = rows[di - start];
      row.total++;
      if (hi[di] > maxH) { row.highs++; row.highTickers.push(sym); }
      if (lo[di] < minL) { row.lows++;  row.lowTickers.push(sym); }
    }
  }

  rows.forEach(r => { r.net = r.highs - r.lows; r.highTickers.sort(); r.lowTickers.sort(); });
  return rows; // oldest first
}
