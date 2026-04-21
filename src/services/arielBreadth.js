const BATCH = 80;

async function fetchHistoryBatch(symbols) {
  try {
    const r = await fetch(`/api/history?symbols=${symbols.join(',')}&range=6mo`);
    if (!r.ok) return {};
    return await r.json();
  } catch { return {}; }
}

export async function fetchArielBreadthData(allSymbols) {
  const batches = [];
  for (let i = 0; i < allSymbols.length; i += BATCH)
    batches.push(allSymbols.slice(i, i + BATCH));

  const results = await Promise.allSettled(batches.map(fetchHistoryBatch));
  const historyMap = {};
  results.forEach(r => { if (r.status === 'fulfilled') Object.assign(historyMap, r.value); });

  // Collect & sort all unique trading-day timestamps
  const tsSet = new Set();
  Object.values(historyMap).forEach(h => { if (h?.timestamps) h.timestamps.forEach(t => tsSet.add(t)); });
  const sortedTs = [...tsSet].sort((a, b) => a - b);
  const N = sortedTs.length;
  if (N < 30) return [];

  // Filter to symbols with sufficient data
  const symbols = Object.keys(historyMap).filter(sym => {
    const h = historyMap[sym];
    return h?.closes?.length > 50 && h?.timestamps?.length > 50;
  });

  // Align each stock's closes to sortedTs index
  const closes = symbols.map(sym => {
    const h = historyMap[sym];
    const map = new Map();
    h.timestamps.forEach((t, i) => map.set(t, h.closes[i]));
    return sortedTs.map(t => map.get(t) ?? null);
  });

  // Rolling SMA-50 using running sum (O(N) per stock)
  const sma50 = closes.map(arr => {
    const res = new Array(N).fill(null);
    let sum = 0, cnt = 0;
    for (let i = 0; i < N; i++) {
      if (arr[i] !== null) { sum += arr[i]; cnt++; }
      if (i >= 50 && arr[i - 50] !== null) { sum -= arr[i - 50]; cnt--; }
      if (cnt >= 30) res[i] = sum / cnt;
    }
    return res;
  });

  // Compute breadth metrics for the last 30 trading days (most-recent first)
  const ROWS = Math.min(30, N);
  const rows = [];

  for (let di = N - 1; di >= N - ROWS; di--) {
    const ts = sortedTs[di];
    const di1 = di - 1, di5 = di - 5, di10 = di - 10,
          di22 = di - 22, di34 = di - 34, di66 = di - 66;

    let up4 = 0, dn4 = 0;
    let pos5 = 0, neg5 = 0, pos10 = 0, neg10 = 0;
    let up25q = 0, dn25q = 0;
    let up25m = 0, dn25m = 0, up50m = 0, dn50m = 0;
    let up13_34 = 0, dn13_34 = 0;
    let above50 = 0, counted = 0;

    for (let si = 0; si < symbols.length; si++) {
      const price = closes[si][di];
      if (!price) continue;
      counted++;

      const p1  = di1  >= 0 ? closes[si][di1]  : null;
      const p5  = di5  >= 0 ? closes[si][di5]  : null;
      const p10 = di10 >= 0 ? closes[si][di10] : null;
      const p22 = di22 >= 0 ? closes[si][di22] : null;
      const p34 = di34 >= 0 ? closes[si][di34] : null;
      const p66 = di66 >= 0 ? closes[si][di66] : null;

      if (p1) {
        const c = (price - p1) / p1 * 100;
        if (c >= 4) up4++; if (c <= -4) dn4++;
      }
      if (p5 && di5 >= 0) { const c = (price - p5) / p5 * 100; if (c > 0) pos5++; else if (c < 0) neg5++; }
      if (p10 && di10 >= 0) { const c = (price - p10) / p10 * 100; if (c > 0) pos10++; else if (c < 0) neg10++; }
      if (p66 && di66 >= 0) { const c = (price - p66) / p66 * 100; if (c >= 25) up25q++; if (c <= -25) dn25q++; }
      if (p22 && di22 >= 0) {
        const c = (price - p22) / p22 * 100;
        if (c >= 25) up25m++; if (c <= -25) dn25m++;
        if (c >= 50) up50m++; if (c <= -50) dn50m++;
      }
      if (p34 && di34 >= 0) { const c = (price - p34) / p34 * 100; if (c >= 13) up13_34++; if (c <= -13) dn13_34++; }
      const sm = sma50[si][di];
      if (sm !== null && price > sm) above50++;
    }

    const ratio5  = neg5  > 0 ? Math.round(pos5  / neg5  * 100) / 100 : (pos5  > 0 ? 9.99 : 1);
    const ratio10 = neg10 > 0 ? Math.round(pos10 / neg10 * 100) / 100 : (pos10 > 0 ? 9.99 : 1);

    rows.push({
      date: new Date(ts * 1000), ts,
      up4, dn4, ratio5, ratio10,
      up25q, dn25q, up25m, dn25m, up50m, dn50m,
      up13_34, dn13_34,
      above50dma: counted > 0 ? Math.round(above50 / counted * 1000) / 10 : 0,
      total: counted,
    });
  }

  return rows; // most-recent first
}
