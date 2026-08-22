// Pre-market / after-hours quotes — fetched on demand (tab is opened), not on the 5s cycle.
const BATCH = 80;

export async function fetchPrePostData(symbols) {
  const batches = [];
  for (let i = 0; i < symbols.length; i += BATCH) batches.push(symbols.slice(i, i + BATCH));

  const results = await Promise.allSettled(
    batches.map(batch =>
      fetch(`/api/quotes?symbols=${batch.join(',')}`)
        .then(r => r.json())
        .then(d => d?.quoteResponse?.result || [])
    )
  );

  const quotes = results.filter(r => r.status === 'fulfilled').flatMap(r => r.value);

  return quotes
    .filter(q => q && q.symbol)
    .map(q => ({
      ticker: q.symbol,
      name: q.shortName || q.symbol,
      marketState: q.marketState,
      price: q.regularMarketPrice,
      prevClose: q.regularMarketPreviousClose,
      preMarketPrice: q.preMarketPrice,
      preMarketChangePercent: q.preMarketChangePercent,
      preMarketTime: q.preMarketTime,
      postMarketPrice: q.postMarketPrice,
      postMarketChangePercent: q.postMarketChangePercent,
      postMarketTime: q.postMarketTime,
    }));
}
