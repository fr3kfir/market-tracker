// Real, verified US-listed tickers organized by sector and theme
// Used for live Yahoo Finance data fetching

export const SECTOR_STOCKS = {
  Technology: ['NVDA','AAPL','MSFT','AVGO','ORCL','CRM','AMD','QCOM','TXN','MU','AMAT','KLAC','LRCX','SNPS','CDNS','NOW','ADBE','INTU','FTNT','PLTR'],
  Energy: ['XOM','CVX','COP','EOG','SLB','MPC','PSX','VLO','DVN','FANG','HAL','BKR','OXY','HES','APA','MRO','CTRA','NOV','RIG','HP'],
  Healthcare: ['LLY','UNH','JNJ','ABBV','MRK','TMO','ABT','DHR','PFE','BMY','AMGN','GILD','REGN','ISRG','VRTX','MDT','EW','HCA','CI','CVS'],
  Financials: ['JPM','V','MA','BAC','WFC','GS','MS','SCHW','AXP','BLK','CB','SPGI','ICE','CME','PGR','AON','TRV','USB','PNC','MCO'],
  'Consumer Discretionary': ['AMZN','TSLA','HD','MCD','NKE','LOW','SBUX','TJX','BKNG','CMG','GM','F','ROST','ORLY','AZO','DHI','LEN','YUM','DRI','EBAY'],
  Industrials: ['GE','CAT','UNP','HON','RTX','LMT','UPS','DE','BA','NOC','GD','FDX','CSX','EMR','ETN','PH','CTAS','IR','ROK','XYL'],
  Materials: ['LIN','APD','SHW','FCX','NEM','ECL','NUE','VMC','MLM','DOW','DD','PPG','ALB','CF','MOS','RS','STLD','IFF','CE','OLN'],
  Utilities: ['NEE','SO','DUK','SRE','AEP','EXC','XEL','D','ED','ETR','AWK','WEC','ES','ATO','LNT','CMS','PPL','NI','AES','PCG'],
  'Real Estate': ['PLD','AMT','EQIX','CCI','PSA','WELL','O','DLR','AVB','EQR','SBAC','ARE','MAA','VTR','EXR','KIM','REG','IRM','NNN','WPC'],
  'Communication Services': ['META','GOOGL','NFLX','DIS','CMCSA','T','VZ','TMUS','CHTR','EA','TTWO','RBLX','SPOT','IAC','WBD','PARA','SNAP','PINS','ZG','MTCH'],
  'Consumer Staples': ['WMT','PG','COST','KO','PEP','PM','MO','MDLZ','CL','KMB','GIS','HSY','CHD','CLX','SJM','CAG','CPB','TAP','ADM','K'],
};

export const THEME_STOCKS = {
  Software: ['MSFT','CRM','NOW','ORCL','ADBE','INTU','WDAY','CDNS','SNPS','DDOG','SNOW','MDB','HUBS','VEEV','GTLB','BILL','NCNO','ESTC','ZI','APPF'],
  'Cyber Security': ['PANW','CRWD','FTNT','ZS','S','CYBR','OKTA','CHKP','NET','TENB','QLYS','VRNS','RPD','SAIL','LDOS','SAIC','CACI','LHX','MNDT','CSCO'],
  Semiconductors: ['NVDA','AVGO','AMD','QCOM','TXN','AMAT','MU','KLAC','LRCX','MRVL','ON','MPWR','ENTG','CRUS','SWKS','QRVO','ADI','MCHP','NXPI','WOLF'],
  Biotech: ['BIIB','REGN','VRTX','GILD','MRNA','BNTX','ALNY','INCY','BMRN','SRPT','RARE','ARWR','AGEN','RXRX','BEAM','EXAS','RCUS','PRTA','ACAD','IONS'],
  'Clean Energy': ['NEE','ENPH','SEDG','RUN','FSLR','BE','PLUG','ARRY','NOVA','SPWR','CWEN','AES','BEP','AMRC','HASI','CLNE','GPRE','AZRE','MAXN','CSIQ'],
  'AI & Machine Learning': ['NVDA','MSFT','GOOGL','META','AMZN','IBM','PLTR','AI','PATH','UPST','AMBA','IONQ','QUBT','RGTI','SOUN','BBAI','GFAI','AIXI','MVST','SERV'],
  'Cloud Computing': ['AMZN','MSFT','GOOGL','CRM','NOW','SNOW','DDOG','NET','ZS','TWLO','MDB','ESTC','PD','BOX','NCNO','CFLT','GTLB','DOCN','FSLY','DBX'],
  Defense: ['LMT','RTX','NOC','GD','BA','HII','LHX','TDG','HEI','LDOS','SAIC','CACI','BWXT','VSAT','KTOS','MOOG','DRS','VSE','MRCY','FLIR'],
  Fintech: ['V','MA','PYPL','SQ','AFRM','SOFI','UPST','HOOD','COIN','NRDS','RELY','FLYW','RPAY','COOP','TREE','LDI','UWMC','PFSI','OPFI','QFIN'],
  'EV & Battery': ['TSLA','RIVN','LCID','NIO','XPEV','LI','F','GM','ALB','LAC','SQM','LTHM','MP','QS','NKLA','FSR','WKHS','FFIE','MVST','GOEV'],
};

// Theme ETFs for accurate theme performance data
export const THEME_ETFS = {
  Software: 'IGV',
  'Cyber Security': 'CIBR',
  Semiconductors: 'SMH',
  Biotech: 'IBB',
  'Clean Energy': 'ICLN',
  'AI & Machine Learning': 'AIQ',
  'Cloud Computing': 'SKYY',
  Defense: 'ITA',
  Fintech: 'ARKF',
  'EV & Battery': 'LIT',
};

// All unique symbols across all sectors (for market breadth calculation)
export const ALL_SYMBOLS = [...new Set([
  ...Object.values(SECTOR_STOCKS).flat(),
])];

export const ALL_THEME_SYMBOLS = [...new Set([
  ...Object.values(THEME_STOCKS).flat(),
])];

export const ALL_ETF_SYMBOLS = Object.values(THEME_ETFS);

export const SECTORS = Object.keys(SECTOR_STOCKS);
export const THEMES = Object.keys(THEME_STOCKS);
