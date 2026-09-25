// Sector + thematic ETFs scanned for "which ETFs hold this stock?".
// Used by api/etf-holders.js (live Yahoo top-10) and
// scripts/fetch-etf-holdings.mjs (full SEC N-PORT holdings).
export const ETF_UNIVERSE = [
  // Broad / style
  'SPY','QQQ','DIA','IWM','MDY','RSP','MAGS','MTUM','FFTY','IPO','FPX','ARKK','ARKW','ARKQ','ARKX','ARKG','ARKF',
  // SPDR sectors
  'XLK','XLF','XLV','XLE','XLI','XLY','XLP','XLU','XLB','XLRE','XLC',
  // Semis / hardware
  'SMH','SOXX','XSD','PSI','SOXQ',
  // Software / cloud / internet / cyber
  'IGV','WCLD','CLOU','SKYY','FDN','SOCL','IBUY','ONLN','CIBR','HACK','BUG','IHAK',
  // AI / robotics / data centers
  'AIQ','BOTZ','ROBO','IRBO','IGPT','CHAT','LOUP','THNQ','DTCR','SRVR','VPN',
  // Crypto / bitcoin miners / blockchain
  'WGMI','BKCH','DAPP','BITQ','CRPT','SATO','BLOK','STCE',
  // Quantum
  'QTUM',
  // Nuclear / uranium / power & grid
  'NLR','URA','URNM','NUKZ','GRID','PAVE','IFRA',
  // Clean energy / EV / battery
  'ICLN','TAN','QCLN','PBW','FAN','CNRG','HYDR','LIT','BATT','DRIV','IDRV','KARS',
  // Aerospace / defense / space
  'ITA','XAR','PPA','SHLD','UFO',
  // Healthcare / biotech
  'IBB','XBI','IHI','XHE','XPH',
  // Financials / fintech
  'KBE','KRE','IAI','FINX','IPAY','KIE',
  // Consumer / housing / travel
  'XRT','XHB','ITB','JETS','PEJ','ESPO','HERO','GAMR','METV',
  // Transport / industrial
  'IYT','XTN','BOAT',
  // Energy / materials / metals
  'XOP','OIH','XES','AMLP','XME','COPX','GDX','GDXJ','SIL','SILJ','SLX','REMX','MOO','WOOD',
  // Cannabis
  'MSOS',
];
