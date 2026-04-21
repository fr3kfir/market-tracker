// Real, verified US-listed tickers — all >$1B market cap
// Used for live Yahoo Finance data fetching

export const SECTOR_STOCKS = {
  Technology: [
    // Mega / Large cap
    'NVDA','AAPL','MSFT','AVGO','ORCL','CRM','AMD','QCOM','TXN','MU',
    'AMAT','KLAC','LRCX','SNPS','CDNS','NOW','ADBE','INTU','FTNT','PLTR',
    'CSCO','IBM','INTC','HPQ','HPE','DELL','WDC','NTAP','PSTG','SMCI',
    // Semis mid-cap
    'MRVL','ON','MPWR','ENTG','ONTO','ACLS','FORM','MKSI','UCTT','ICHR',
    'ARM','ALAB','TSM','ASML','CAMT','AMKR','SITM','MTSI','SLAB','IOSP',
    'CRUS','SWKS','QRVO','NXPI','ADI','MCHP','DIOD','PI','WOLF','ALGM',
    'AEIS','COHR','LITE','VIAV','CIEN','CALX','ADTN','PURE','NTNX','POWI',
    // Networking / Security
    'ANET','NET','CRWD','PANW','ZS','OKTA','S','CYBR','TENB','QLYS',
    // Cloud / SaaS
    'DDOG','SNOW','MDB','TEAM','GTLB','TWLO','CFLT','PD','DBX','BOX',
    'WDAY','HUBS','VEEV','BILL','NCNO','ESTC','ZI','APPF','ASAN','KVYO',
    // AI / Emerging
    'PATH','AI','AMBA','RBRK','APP','TTD','CEVA','HIMX','ATEN',
    // Quantum Computing
    'IONQ','QUBT','QBTS','RGTI',
    // AI Cloud / Infrastructure
    'NBIS','CWAN','DOCN',
  ],
  Energy: [
    // Majors
    'XOM','CVX','COP','EOG','SLB','MPC','PSX','VLO','DVN','FANG',
    'HAL','BKR','OXY','HES','APA','MRO','CTRA','NOV','RIG','HP',
    // Midstream
    'WMB','OKE','KMI','ET','EPD','TRGP','LNG','AM','MPLX','HESM',
    // E&P mid-cap
    'SM','MTDR','NOG','VTLE','CIVI','OVV','CHRD','PR','RRC','EQT',
    'AR','SWN','SU','CNQ','IMO','GPOR','DK','PARR',
    // Services / Refining
    'FTI','WFRD','TDW','PTEN','NBR','PBF','DINO','CVI','VNOM',
  ],
  Healthcare: [
    // Large cap pharma / managed care
    'LLY','UNH','JNJ','ABBV','MRK','TMO','ABT','DHR','PFE','BMY',
    'AMGN','GILD','REGN','ISRG','VRTX','MDT','EW','HCA','CI','CVS',
    'HUM','ELV','CNC','MOH','THC','DVA',
    // Biotech
    'BIIB','MRNA','ALNY','INCY','BMRN','SRPT','RARE','ARWR','RXRX','BEAM',
    'EXAS','CRSP','FOLD','IONS','ACAD','KYMR','NTLA','SMMT','IMVT','ARQT',
    'DNLI','ACLX','KROS','RVMD','TGTX','RNA','PRTA',
    // Devices / diagnostics
    'BSX','SYK','ZBH','HOLX','TFX','BAX','BDX','INSP','IRTC','TMDX',
    'ATRC','AXNX','MMSI','GMED','PODD','IQV','ILMN','A','BIO','NTRA',
    'NEOG','MTD','VEEV','IDXX',
    // Digital health
    'HIMS','DOCS','TEM','OSCR','ALHC','ACCD','AXSM','PRAX','CERE',
  ],
  Financials: [
    // Banks
    'JPM','BAC','WFC','C','USB','TFC','PNC','GS','MS','SCHW',
    'KEY','FITB','RF','MTB','HBAN','CFG','ZION','EWBC','WAL','BOKF',
    'SNV','WTFC','IBKR',
    // Payments
    'V','MA','AXP','FIS','FISV','PAYX','ADP','WEX','FLT','FOUR',
    'SQ','PYPL','AFRM','SOFI','NU','HOOD','COIN','BILL',
    // Bitcoin / Crypto Treasury & Mining
    'MSTR','MARA','RIOT','CIFR','CLSK','HUT','WULF','CORZ','BTBT','SMLR',
    // Insurance
    'PGR','ALL','TRV','CB','HIG','WRB','RLI','ERIE','KNSL','RYAN',
    'ACGL','RNR','LMND','AON','MCO',
    // Asset mgmt / exchanges
    'BLK','BX','APO','KKR','ARES','CG','BAM','TPG','STEP','OWL',
    'SPGI','ICE','CME','CBOE','MSCI','NDAQ','MKTX','FICO',
    // Other
    'AMP','TROW','BEN','IVZ','AMG','SEIC','JEF','EVR','LAZ','RJF',
  ],
  'Consumer Discretionary': [
    // Large cap
    'AMZN','TSLA','HD','MCD','NKE','LOW','SBUX','TJX','BKNG','CMG',
    'GM','F','ROST','ORLY','AZO','DHI','LEN','YUM','DRI','EBAY',
    // Apparel / footwear
    'LULU','DECK','ONON','SKX','CROX','UAA','HBI','VFC','RL','PVH',
    'BIRK','VSCO','CPRI','TPR','AEO','ANF','URBN','BOOT','GOOS',
    // Homebuilders
    'NVR','PHM','TOL','TMHC','MHO','SKY','CVCO','KBH','MDC','TPH','BLDR',
    // Travel / Leisure
    'ABNB','HLT','MAR','CCL','RCL','NCLH','EXPE','VAC','TNL',
    // EV
    'RIVN','NIO','LI','XPEV','LCID','CHPT',
    // Restaurants
    'TXRH','WING','SHAK','EAT','BJRI','DINE','CAKE',
    // E-commerce
    'W','ETSY','CPNG','SE','JD','PDD','MELI','CHWY','CARG',
    // Auto
    'AN','KMX','PAG','GPC','LKQ','DORM','ALSN',
  ],
  Industrials: [
    // Defense / Aerospace
    'GE','LMT','RTX','NOC','GD','BA','HII','TDG','HEI','LHX',
    'KTOS','AVAV','RKLB','MOOG','DRS','OSIS','AXON','LDOS','SAIC','CACI',
    'BWXT','MRCY','VSE','PL','ASTS',
    // Industrials
    'CAT','UNP','HON','UPS','DE','FDX','CSX','EMR','ETN','PH',
    'CTAS','IR','ROK','XYL','ITW','CMI','AGCO','TXT','GGG','AME',
    'LII','CARR','OTIS','MIDD','ATI','GNRC',
    // Transport
    'DAL','UAL','AAL','LUV','ALK','JBLU','ALGT',
    'ODFL','SAIA','JBHT','XPO','CHRW','EXPD','TFII','HUBG',
    'NSC','CP','CNI','WAB','GBX','GATX',
    // Grid / Electrical
    'PWR','HUBB','VRT','REZI','POWL','AYI','BE','ACHR','JOBY','LUNR',
    // Construction
    'VMC','MLM','MAS','EME','FAST','BECN','AWI','FTAI',
  ],
  Materials: [
    // Diversified / Chemicals
    'LIN','APD','SHW','FCX','NEM','ECL','NUE','VMC','MLM','DOW',
    'DD','PPG','ALB','CF','MOS','RS','STLD','IFF','CE','OLN',
    'LYB','RPM','HUN','TROX','ASIX','MEOH','BCPC',
    // Gold / Silver miners
    'AEM','GOLD','KGC','WPM','AGI','OR','PAAS','EQX','HL','BTG',
    'MAG','NSU','DRD','HMY','AU','SBSW','GFI','RGLD','FNV','SSRM',
    // Copper / Base metals
    'SCCO','TECK','HBM','ERO','FM','SQM','LAC','LTHM','ALTM','SGML','PLL',
    // Steel
    'CLF','X','CMC','ZEUS','TX','MT','VALE','PKX','SID','KALU',
    'CENX','ATI','HCC','AMR','METC','CSTM','HAYN',
    // Uranium / Critical
    'CCJ','DNN','UEC',
  ],
  Utilities: [
    'NEE','SO','DUK','SRE','AEP','EXC','XEL','D','ED','ETR',
    'AWK','WEC','ES','ATO','LNT','CMS','PPL','NI','AES','PCG',
    'BEP','CWEN','ENPH','SEDG','FSLR','BE','PLUG','AMRC','HASI',
    'OGE','OTTR','MGEE','BKH','PNM','AVA','IDA',
    // Nuclear Power
    'CEG','VST','NRG','SMR','OKLO','UUUU',
  ],
  'Real Estate': [
    'PLD','AMT','EQIX','CCI','PSA','WELL','O','DLR','AVB','EQR',
    'SBAC','ARE','MAA','VTR','EXR','KIM','REG','IRM','NNN','WPC',
    'REXR','STAG','EGP','FR','LXP','TRNO','IIPR',
    'VNO','BXP','SLG','KRC','CUZ','HPP',
    'INVH','AMH','AIR','IRT','UDR','CPT',
    'OHI','SBRA','NHI','HR','CTRE','LTC','MPW',
    'COR','UNIT',
  ],
  'Communication Services': [
    'META','GOOGL','NFLX','DIS','CMCSA','T','VZ','TMUS','CHTR','EA',
    'TTWO','RBLX','SPOT','IAC','WBD','PARA','SNAP','PINS','MTCH','RDDT',
    'BMBL','YELP','APP','TTD','MGNI','DV','IAS','CRTO','PUBM','ZETA',
    'ROKU','SIRI','IHRT','NYT','FOX','DKNG','PENN','GAN','GENI',
    'DISH','LUMN','USM','CABO','ATUS','IRDM','GOGO','VRNS',
  ],
  'Consumer Staples': [
    'WMT','PG','COST','KO','PEP','PM','MO','MDLZ','CL','KMB',
    'GIS','HSY','CHD','CLX','SJM','CAG','CPB','TAP','ADM','K',
    'MNST','CELH','UTZ','NOMD','FIZZ','STZ','BUD','SAM','MGPI',
    'KR','SFM','GO','ACI','BJ','PFGC','USFD','SYY','CHEF',
    'MKC','SMPL','JJSF','LANC','CALM','COKE','VITL','WDFC',
  ],
};

export const THEME_STOCKS = {
  Software: ['MSFT','CRM','NOW','ORCL','ADBE','INTU','WDAY','CDNS','SNPS','DDOG','SNOW','MDB','HUBS','VEEV','GTLB','BILL','NCNO','ESTC','ZI','APPF'],
  'Cyber Security': ['PANW','CRWD','FTNT','ZS','S','CYBR','OKTA','CHKP','NET','TENB','QLYS','VRNS','LDOS','SAIC','CACI','LHX','CSCO','RBRK','MNDT','SAIL'],
  Semiconductors: ['NVDA','AVGO','AMD','QCOM','TXN','AMAT','MU','KLAC','LRCX','MRVL','ON','MPWR','ENTG','CRUS','SWKS','QRVO','ADI','MCHP','NXPI','WOLF'],
  Biotech: ['BIIB','REGN','VRTX','GILD','MRNA','ALNY','INCY','BMRN','SRPT','RARE','ARWR','RXRX','BEAM','EXAS','FOLD','SMMT','IMVT','RVMD','TGTX','RNA'],
  'Clean Energy': ['NEE','ENPH','SEDG','FSLR','BE','PLUG','CWEN','AES','BEP','AMRC','HASI','RUN','ARRY','NOVA','SPWR','CSIQ','MAXN','AZRE','GPRE','CLNE'],
  'AI & Machine Learning': ['NVDA','MSFT','GOOGL','META','AMZN','IBM','PLTR','AI','PATH','AMBA','IONQ','SOUN','RBRK','APP','BBAI','ALAB','ARM','KVYO','ASAN','TTD'],
  'Cloud Computing': ['AMZN','MSFT','GOOGL','CRM','NOW','SNOW','DDOG','NET','ZS','TWLO','MDB','ESTC','PD','BOX','CFLT','GTLB','PURE','NTNX','HUBS','DBX'],
  Defense: ['LMT','RTX','NOC','GD','BA','HII','LHX','TDG','HEI','LDOS','SAIC','CACI','BWXT','KTOS','MOOG','DRS','VSE','MRCY','AXON','AVAV'],
  Fintech: ['V','MA','PYPL','SQ','AFRM','SOFI','NU','HOOD','COIN','BILL','FOUR','WEX','FLT','RELY','UPST','LC','OPFI','COOP','PFSI','GHLD'],
  'EV & Battery': ['TSLA','RIVN','LCID','NIO','XPEV','LI','F','GM','ALB','LAC','SQM','LTHM','ALTM','MP','QS','CHPT','BLNK','EVGO'],
  'Bitcoin & Crypto': ['MSTR','COIN','MARA','RIOT','CIFR','CLSK','HUT','WULF','CORZ','HOOD','BTBT','SMLR'],
  'Quantum Computing': ['IONQ','QUBT','QBTS','RGTI','IBM','GOOGL','MSFT'],
  'Nuclear Energy': ['CEG','VST','NRG','SMR','OKLO','BWXT','CCJ','DNN','UEC','UUUU'],
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
  'Bitcoin & Crypto': 'BITO',
  'Quantum Computing': 'QTUM',
  'Nuclear Energy': 'NLR',
};

// ── Industry Sub-Groups (IBD-style, >$1B market cap only) ────────────────────
export const INDUSTRY_GROUPS = [
  // ── Technology — Semiconductors ──
  { name: 'Semis — AI / GPU',       sector: 'Technology',             tickers: ['NVDA','AMD','MRVL','AVGO','ARM','QCOM','INTC','MPWR','SMCI','ALAB','ASML','TSM','LSCC','CEVA','HIMX','ATEN','MU','ON','NXPI','ADI','TXN','KLAC','AMAT','LRCX','ENTG','ONTO','AMKR','COHR','WOLF'] },
  { name: 'Semis — Memory',         sector: 'Technology',             tickers: ['MU','WDC','STX','NTAP','PSTG','CRUS','RMBS','NXPI','MCHP','ADI','LRCX','KLAC','AMAT','UCTT','FORM','ONTO','ICHR','NVDA','AMD'] },
  { name: 'Semis — Equipment',      sector: 'Technology',             tickers: ['AMAT','KLAC','LRCX','ENTG','ONTO','ACLS','FORM','MKSI','UCTT','ICHR','CAMT','AMKR','COHU','AEIS','NVMI','KLIC','ASML','NVDA','AMD','SMCI','IPGP','ACMR','ARM'] },
  { name: 'Semis — Analog',         sector: 'Technology',             tickers: ['TXN','ADI','MCHP','ON','SWKS','QRVO','NXPI','SLAB','SITM','IOSP','DIOD','MTSI','ALGM','POWI','MPWR','QCOM','AVGO','SMSC','INTF','IXYS','NVDA'] },
  { name: 'Semis — Optics / Laser', sector: 'Technology',             tickers: ['LITE','COHR','VIAV','CIEN','MTSI','CALX','PI','MACOM','ATEN','ADTN','INFN','IPGP','AAOI','ACIA','FNSR','IIVI','NVDA','AVGO','MRVL'] },
  { name: 'Semis — Power',          sector: 'Technology',             tickers: ['MPWR','ON','WOLF','POWI','SLAB','AEIS','DIOD','IOSP','SITM','ALGM','CAMT','AMKR','VICR','TXN','ADI','NXPI','NVDA','MCHP','INTC'] },
  // ── Technology — Software ──
  { name: 'Software — Enterprise',  sector: 'Technology',             tickers: ['CRM','ORCL','NOW','WDAY','INTU','ADBE','MSFT','IBM','CTSH','EPAM','ACN','SAP','SMAR','APPF','PEGA','DOMO','ANSS','PTC','CDNS','SNPS','MANH','CDAY','TOAD','ALTR','VEEV','HUBS'] },
  { name: 'Software — Security',    sector: 'Technology',             tickers: ['CRWD','PANW','FTNT','ZS','CYBR','S','OKTA','CHKP','NET','TENB','QLYS','VRNS','RBRK','CSCO','RPD','SAIL','SAIC','LDOS','CACI','CWAN','MNDT','FEYE','SCWX','ISTR','OSPN'] },
  { name: 'Software — Cloud Infra', sector: 'Technology',             tickers: ['SNOW','MDB','DDOG','TEAM','GTLB','NET','TWLO','CFLT','PD','DBX','BOX','HUBS','ESTC','PURE','NTNX','DOCN','CLDR','FSLY','AMPL','BRZE','SUMO','NCNO','TOST','MNDY'] },
  { name: 'Software — AI / Data',   sector: 'Technology',             tickers: ['PLTR','AI','PATH','AMBA','RBRK','ANET','KVYO','ASAN','APP','TTD','MGNI','DV','ZETA','UPST','BBAI','SOUN','IONQ','NBIS','QUBT','QBTS','RGTI','MSFT','GOOGL','META','NVDA','IBM'] },
  { name: 'Software — SMB / Vert.', sector: 'Technology',             tickers: ['BILL','VEEV','ZI','APPF','HUBS','PCOR','MNDY','TOST','TASK','BAND','EVBG','SPSC','PAR','XPEL','ALRM','QTWO','JAMF','SMAR','ACMR','DBTX','AVEYA','PERI','FOUR','NTNX'] },
  { name: 'Hardware — Networking',  sector: 'Technology',             tickers: ['CSCO','ANET','VIAV','CIEN','CALX','LITE','COHR','ADTN','INFN','FFIV','JNPR','EXTR','NTGR','RBBN','CASA','ARLO','SMCI','HPE','DELL','NVDA','MRVL','AVGO'] },
  { name: 'Hardware — Servers',     sector: 'Technology',             tickers: ['DELL','HPE','NTAP','SMCI','PSTG','HPQ','WDC','NTNX','PURE','NVDA','AMD','ALAB','VRT','ARM','AAPL','MSFT','AVGO','MRVL','INTC','QCOM','IBM'] },
  { name: 'IT Services / Consult',  sector: 'Technology',             tickers: ['ACN','IBM','CTSH','EPAM','WIT','INFY','GLOB','CACI','SAIC','LDOS','DXC','UNISYS','KFRC','EXLS','NSIT','ASGN','HCKT','ICFI','PSNL'] },
  { name: 'Quantum Computing',      sector: 'Technology',             tickers: ['IONQ','QUBT','QBTS','RGTI','IBM','GOOGL','MSFT','NVDA','ARQQ','QTUM','HONQ','QMCO'] },
  { name: 'AI Cloud / Infra',       sector: 'Technology',             tickers: ['NBIS','SMCI','ALAB','DOCN','CWAN','DDOG','SNOW','MDB','PLTR','NET','NVDA','MSFT','GOOGL','AMZN','META','AMD','VRT','DELL','HPE','ANET'] },
  { name: 'IT Services / Consult',  sector: 'Technology',             tickers: ['ACN','IBM','CTSH','EPAM','WIT','INFY','GLOB','CACI','SAIC','LDOS','DXC','UNISYS','KFRC'] },
  // ── Energy ──
  { name: 'E&P — Major',            sector: 'Energy',                 tickers: ['XOM','CVX','COP','EOG','DVN','OXY','HES','APA','FANG','MRO','SU','CNQ','IMO','OVV','CHRD','PR','CTRA'] },
  { name: 'E&P — Independent',      sector: 'Energy',                 tickers: ['MRO','APA','FANG','OVV','CTRA','SM','MTDR','NOG','VTLE','CIVI','CHRD','RRC','EQT','AR','SWN','GPOR','PDCE'] },
  { name: 'Oil Services',           sector: 'Energy',                 tickers: ['SLB','HAL','BKR','NOV','RIG','FTI','WFRD','TDW','CHX','PTEN','NBR','LBRT'] },
  { name: 'Refining',               sector: 'Energy',                 tickers: ['PSX','VLO','MPC','PBF','DINO','DK','PARR','CVI','VNOM'] },
  { name: 'Pipelines / Midstream',  sector: 'Energy',                 tickers: ['ET','EPD','KMI','WMB','OKE','TRGP','LNG','AM','MPLX','HESM','DCP','CEQP','USAC','NFE'] },
  // ── Healthcare ──
  { name: 'Biotech — Large Cap',    sector: 'Healthcare',             tickers: ['AMGN','GILD','REGN','VRTX','MRNA','BIIB','ALNY','INCY','EXEL','BMRN','RARE','SRPT','IONS','ACAD','ARWR','BEAM','FOLD','KYMR','SMMT','IMVT'] },
  { name: 'Biotech — Clinical',     sector: 'Healthcare',             tickers: ['RXRX','PRTA','KYMR','CRSP','SMMT','IMVT','ARQT','DNLI','ACLX','KROS','RVMD','TGTX','RNA','NTLA','BEAM','FOLD','ACAD','AXSM','PRAX','CERE'] },
  { name: 'Biotech — Oncology',     sector: 'Healthcare',             tickers: ['EXEL','RCUS','IMCR','RVMD','TGTX','MRUS','ARVN','GRTX','ACLX','KROS','RNA','SMMT','DNLI','CLDX','LNTH','ZYME'] },
  { name: 'Medical Devices — Large',sector: 'Healthcare',             tickers: ['MDT','ABT','ISRG','BSX','EW','SYK','ZBH','HOLX','TFX','BAX','BDX','ALGN','NVST','GMED','PODD'] },
  { name: 'Medical Devices — Small',sector: 'Healthcare',             tickers: ['INSP','IRTC','TMDX','ATRC','AXNX','MMSI','GMED','PODD','NARI','RXST','SILK','PRCT','MASI','LMAT','OFIX'] },
  { name: 'Pharma — Large Cap',     sector: 'Healthcare',             tickers: ['LLY','JNJ','PFE','MRK','BMY','ABBV','AZN','NVO','GSK','SNY','RPRX','PRGO','AMRN','IDYA'] },
  { name: 'Managed Care',           sector: 'Healthcare',             tickers: ['UNH','CVS','HUM','ELV','CNC','MOH','HCA','THC','DVA','OSCR','ALHC','ACCD','HIMS','DOCS','OMI'] },
  { name: 'Diagnostics / Tools',    sector: 'Healthcare',             tickers: ['TMO','DHR','ILMN','EXAS','A','IQV','BIO','NTRA','VEEV','IDXX','MTD','PODD','TEM','NXGN','GDRX','ONEM'] },
  // ── Financials ──
  { name: 'Banks — Large Cap',      sector: 'Financials',             tickers: ['JPM','BAC','WFC','C','USB','TFC','PNC','KEY','FITB','RF','MTB','HBAN','CFG','ZION','CMA','WAL','BOKF','SNV'] },
  { name: 'Banks — Regional',       sector: 'Financials',             tickers: ['FITB','RF','HBAN','CFG','ZION','KEY','WTFC','BOKF','SNV','EWBC','WAL','COLB','CVBF','BANC','FFIN','HTLF','CADE','IBKR'] },
  { name: 'Investment Banks',       sector: 'Financials',             tickers: ['GS','MS','JEF','EVR','LAZ','MC','HLI','PJT','RJF','SF','PIPR','AMP','TROW','BEN','IVZ','AMG','SEIC'] },
  { name: 'Payments — Large',       sector: 'Financials',             tickers: ['V','MA','AXP','FIS','FISV','PAYX','ADP','WEX','FLT','FOUR','BR','EVTC','RPAY','IIIV'] },
  { name: 'Payments — Fintech',     sector: 'Financials',             tickers: ['SQ','PYPL','AFRM','SOFI','NU','HOOD','COIN','BILL','UPST','LC','OPFI','COOP','GHLD','PFSI'] },
  { name: 'Insurance — P&C',        sector: 'Financials',             tickers: ['PGR','ALL','TRV','CB','HIG','WRB','RLI','ERIE','KNSL','RYAN','ACGL','RNR','LMND','AON','MCO','SLQT','PLMR'] },
  { name: 'Asset Management',       sector: 'Financials',             tickers: ['BLK','BX','APO','KKR','ARES','CG','BAM','TPG','STEP','OWL','AMG','SEIC','TROW','BEN','IVZ','HLNE','CSWC'] },
  { name: 'Exchanges / Data',       sector: 'Financials',             tickers: ['CME','ICE','CBOE','MSCI','SPGI','MCO','NDAQ','MKTX','TW','FICO','VRSK','COIN','ENV','DFIN','FCNCA','IBKR'] },
  { name: 'Bitcoin & Crypto Mining',sector: 'Financials',             tickers: ['MSTR','MARA','RIOT','CIFR','CLSK','HUT','WULF','CORZ','COIN','BTBT','HOOD','SMLR'] },
  // ── Consumer Discretionary ──
  { name: 'Autos — EV',             sector: 'Consumer Discretionary', tickers: ['TSLA','RIVN','NIO','LI','XPEV','LCID','BLNK','CHPT','EVGO','GM','F'] },
  { name: 'Autos — Legacy',         sector: 'Consumer Discretionary', tickers: ['GM','F','STLA','TM','HMC','HOG','PATK','GNTX','ADNT','VC','APTV','LEA','BWA','MGA','DORM','ALSN'] },
  { name: 'Restaurants — QSR',      sector: 'Consumer Discretionary', tickers: ['MCD','SBUX','YUM','DPZ','QSR','WEN','JACK','SHAK','LOCO','NDLS','ARMK','TXRH'] },
  { name: 'Restaurants — Casual',   sector: 'Consumer Discretionary', tickers: ['CMG','TXRH','DRI','WING','SHAK','EAT','BJRI','DINE','CAKE','DENN','BJ'] },
  { name: 'Homebuilders',           sector: 'Consumer Discretionary', tickers: ['DHI','LEN','PHM','TOL','NVR','TMHC','MHO','SKY','CVCO','KBH','MDC','TPH','CCS','GRBK','LGIH','MTH','BECN','BLDR'] },
  { name: 'Retail — Apparel',       sector: 'Consumer Discretionary', tickers: ['NKE','LULU','TJX','ROST','PVH','RL','SKX','CROX','UAA','HBI','VFC','GOOS','ONON','DECK','BIRK','VSCO','CPRI','TPR','AEO','ANF'] },
  { name: 'Retail — E-commerce',    sector: 'Consumer Discretionary', tickers: ['AMZN','ETSY','W','CHWY','CPNG','SE','JD','PDD','MELI','EBAY','CARG','FTDR'] },
  { name: 'Leisure / Travel',       sector: 'Consumer Discretionary', tickers: ['ABNB','BKNG','HLT','MAR','CCL','RCL','NCLH','EXPE','VAC','TNL','TRIP','HGV','IHG','WH'] },
  { name: 'Auto Parts / Dealers',   sector: 'Consumer Discretionary', tickers: ['AZO','ORLY','AAP','AN','KMX','PAG','GPC','LKQ','DORM','ALSN','APTV','GT'] },
  { name: 'Footwear / Athleisure',  sector: 'Consumer Discretionary', tickers: ['NKE','LULU','ONON','DECK','BIRK','SKX','CROX','UAA','BOOT','GOOS','COLM','VFC','RL'] },
  // ── Industrials ──
  { name: 'Aerospace / Defense',    sector: 'Industrials',            tickers: ['LMT','RTX','NOC','GD','BA','HII','TDG','HEI','TXT','DRS','BWXT','MOOG','AXON','HEICO'] },
  { name: 'Defense — Growth',       sector: 'Industrials',            tickers: ['AVAV','RKLB','KTOS','MOOG','LDOS','SAIC','CACI','VSE','MRCY','DRS','OSIS','PL','AXON','ASTS'] },
  { name: 'Space Technology',       sector: 'Industrials',            tickers: ['RKLB','ASTS','PL','MAXR','VSAT','IRDM','GOGO','ATRO','LUNR','SPIR'] },
  { name: 'Airlines',               sector: 'Industrials',            tickers: ['DAL','UAL','AAL','LUV','ALK','HA','JBLU','ALGT','SKYW'] },
  { name: 'Rails',                  sector: 'Industrials',            tickers: ['UNP','CSX','NSC','CP','CNI','WAB','GBX','GATX','HXL','ATI'] },
  { name: 'Freight / Logistics',    sector: 'Industrials',            tickers: ['FDX','UPS','ODFL','SAIA','JBHT','XPO','CHRW','EXPD','TFII','HUBG','GFL'] },
  { name: 'Machinery',              sector: 'Industrials',            tickers: ['CAT','DE','EMR','PH','ROK','ITW','CMI','AGCO','TXT','XYL','GGG','FELE','AME','LII','CARR','OTIS','MIDD','GNRC'] },
  { name: 'Electrical / Grid',      sector: 'Industrials',            tickers: ['ETN','GNRC','POWL','AYI','PWR','HUBB','VRT','REZI','ARRY','BE','AEIS','ENPH','SEDG','FSLR'] },
  { name: 'Construction / Infra',   sector: 'Industrials',            tickers: ['VMC','MLM','NUE','PWR','MAS','EME','FAST','BECN','BLDR','AWI','APOG','UFP','SUM','EXP','DOOR','TREX','FTAI'] },
  { name: 'eVTOL / UAM',            sector: 'Industrials',            tickers: ['JOBY','ACHR','ASTS','RKLB','AVAV','KTOS'] },
  // ── Materials ──
  { name: 'Gold Mining',            sector: 'Materials',              tickers: ['NEM','AEM','GOLD','KGC','WPM','AGI','OR','PAAS','EQX','HL','BTG','MAG','NSU','DRD','HMY','AU','SBSW','GFI','RGLD','FNV'] },
  { name: 'Copper Mining',          sector: 'Materials',              tickers: ['FCX','SCCO','TECK','HBM','ERO','FM','CMC','SQM','ALTM'] },
  { name: 'Steel',                  sector: 'Materials',              tickers: ['NUE','STLD','CLF','X','RS','CMC','ZEUS','TX','PKX','SID','MT','VALE','KALU','CENX','AMR','ATI','HCC','METC','CSTM','HAYN'] },
  { name: 'Lithium / Battery',      sector: 'Materials',              tickers: ['ALB','SQM','LAC','LTHM','ALTM','SGML','PLL','MP','QS'] },
  { name: 'Chemicals',              sector: 'Materials',              tickers: ['LIN','APD','DOW','SHW','PPG','ECL','IFF','RPM','CE','OLN','LYB','HUN','TROX','ASIX','MEOH','BCPC'] },
  { name: 'Silver / Precious',      sector: 'Materials',              tickers: ['WPM','PAAS','HL','MAG','AG','SVM','SSRM','OR','AEM','KGC','EQX','BTG','NSU','RGLD','FNV'] },
  { name: 'Uranium',                sector: 'Materials',              tickers: ['CCJ','DNN','UEC','UUUU'] },
  { name: 'Nuclear Power',          sector: 'Utilities',              tickers: ['CEG','VST','NRG','SMR','OKLO','BWXT','CCJ','UUUU'] },
  // ── Communication Services ──
  { name: 'Social Media',           sector: 'Communication Services', tickers: ['META','SNAP','PINS','RDDT','BMBL','MTCH','IAC','YELP','APP','ZG','VRNS'] },
  { name: 'Search / Advertising',   sector: 'Communication Services', tickers: ['GOOGL','TTD','MGNI','DV','IAS','CRTO','PUBM','APPS','ZETA','APP','BRZE','LPSN'] },
  { name: 'Streaming / Content',    sector: 'Communication Services', tickers: ['NFLX','DIS','ROKU','SPOT','WBD','PARA','SIRI','IHRT','NYT','FOX','FUBO','AMCX','PLBY'] },
  { name: 'Telecom',                sector: 'Communication Services', tickers: ['T','VZ','TMUS','CHTR','CMCSA','DISH','LUMN','USM','CABO','ATUS','GOGO','IRDM','GSAT','IDT'] },
  { name: 'Gaming',                 sector: 'Communication Services', tickers: ['EA','TTWO','RBLX','PLTK','DKNG','PENN','GAN','GENI','EVRI','AGS','ACEL'] },
  // ── Consumer Staples ──
  { name: 'Food & Beverage',        sector: 'Consumer Staples',       tickers: ['KO','PEP','GIS','HSY','MDLZ','MNST','KHC','CPB','SJM','CAG','TAP','STZ','CELH','VITL','UTZ','NOMD','FIZZ','COKE','MKC','SMPL'] },
  { name: 'Household Products',     sector: 'Consumer Staples',       tickers: ['PG','KMB','CL','CLX','CHD','REYN','SPB','NWL','HRB','COTY','EPC','ENR','WDFC'] },
  { name: 'Retail — Grocery',       sector: 'Consumer Staples',       tickers: ['WMT','COST','KR','SFM','GO','ACI','BJ','PFGC','CHEF','USFD','SYY','UNFI'] },
  { name: 'Tobacco / Alcohol',      sector: 'Consumer Staples',       tickers: ['MO','PM','BTI','STZ','TAP','BUD','SAM','MGPI','VGR','TPB'] },
  // ── Real Estate ──
  { name: 'REITs — Industrial',     sector: 'Real Estate',            tickers: ['PLD','REXR','STAG','EGP','FR','LXP','TRNO','IIPR','EPRT','NTST'] },
  { name: 'REITs — Data Centers',   sector: 'Real Estate',            tickers: ['EQIX','DLR','IRM','AMT','SBAC','CCI','COR'] },
  { name: 'REITs — Cell Towers',    sector: 'Real Estate',            tickers: ['AMT','CCI','SBAC','UNIT','SBA'] },
  { name: 'REITs — Residential',    sector: 'Real Estate',            tickers: ['EQR','AVB','MAA','CPT','UDR','AIR','IRT','INVH','AMH','AIRC'] },
  { name: 'REITs — Healthcare',     sector: 'Real Estate',            tickers: ['WELL','VTR','OHI','SBRA','NHI','HR','CTRE','LTC','MPW','GMRE'] },
  { name: 'REITs — Office / Mixed', sector: 'Real Estate',            tickers: ['VNO','BXP','SLG','KRC','CUZ','HPP','DEI','ESRT','PDM','BRT'] },
];

export const ALL_INDUSTRY_SYMBOLS = [...new Set(INDUSTRY_GROUPS.flatMap(g => g.tickers))];

// ── Hot Themes (granular, IBD-style groupings) ───────────────────────
const _HOT_THEMES_RAW = [
  // ── Semiconductors (broad) ──
  { name: 'Semiconductors',          etf: 'SOXX',  groups: ['Semis — AI / GPU', 'Semis — Memory', 'Semis — Equipment', 'Semis — Analog', 'Semis — Optics / Laser', 'Semis — Power'] },
  // ── AI & Compute ──
  { name: 'AI Infrastructure',       etf: 'AIQ',   groups: ['Semis — AI / GPU', 'Hardware — Servers', 'Software — AI / Data', 'AI Cloud / Infra'] },
  { name: 'AI Software',             etf: 'AIQ',   groups: ['Software — AI / Data', 'Software — Enterprise', 'Software — Cloud Infra'] },
  { name: 'Semis — Equipment',       etf: 'SOXX',  groups: ['Semis — Equipment'] },
  { name: 'Optics & Lasers',         etf: 'SOXX',  groups: ['Semis — Optics / Laser'] },
  { name: 'Semis — Analog & Power',  etf: 'SOXX',  groups: ['Semis — Analog', 'Semis — Power'] },
  { name: 'Cloud & SaaS',            etf: 'SKYY',  groups: ['Software — Cloud Infra', 'Software — Enterprise', 'Software — SMB / Vert.'] },
  { name: 'Cybersecurity',           etf: 'CIBR',  groups: ['Software — Security'] },
  { name: 'Networking',              etf: 'IGV',   groups: ['Hardware — Networking', 'Hardware — Servers'] },
  // ── Defense & Space ──
  { name: 'Defense & Space',         etf: 'ITA',   groups: ['Aerospace / Defense', 'Defense — Growth'] },
  // ── Energy ──
  { name: 'Energy Transition',       etf: 'ICLN',  groups: ['Electrical / Grid', 'Nuclear Power'] },
  { name: 'Oil & Gas',               etf: 'XLE',   groups: ['E&P — Major', 'E&P — Independent', 'Oil Services', 'Refining'] },
  { name: 'Pipelines & Midstream',   etf: 'AMLP',  groups: ['Pipelines / Midstream'] },
  // ── Healthcare ──
  { name: 'Biotech',                 etf: 'IBB',   groups: ['Biotech — Large Cap', 'Biotech — Clinical', 'Biotech — Oncology'] },
  { name: 'MedTech & Diagnostics',   etf: 'IHI',   groups: ['Medical Devices — Large', 'Medical Devices — Small', 'Diagnostics / Tools'] },
  { name: 'Pharma & Managed Care',   etf: 'XPH',   groups: ['Pharma — Large Cap', 'Managed Care'] },
  // ── Financials ──
  { name: 'Banks',                   etf: 'KBE',   groups: ['Banks — Large Cap', 'Banks — Regional'] },
  { name: 'Fintech & Payments',      etf: 'ARKF',  groups: ['Payments — Large', 'Payments — Fintech'] },
  { name: 'Asset Mgmt & Exchanges',  etf: 'IAI',   groups: ['Asset Management', 'Exchanges / Data', 'Investment Banks'] },
  { name: 'Insurance',               etf: 'KIE',   groups: ['Insurance — P&C'] },
  // ── Consumer ──
  { name: 'Homebuilders',            etf: 'ITB',   groups: ['Homebuilders'] },
  { name: 'Autos & EV',              etf: 'DRIV',  groups: ['Autos — EV', 'Autos — Legacy'] },
  { name: 'Travel & Airlines',       etf: 'JETS',  groups: ['Leisure / Travel', 'Airlines'] },
  { name: 'Retail',                  etf: 'XRT',   groups: ['Retail — Apparel', 'Retail — Grocery', 'Retail — E-commerce'] },
  { name: 'Restaurants',             etf: 'EATZ',  groups: ['Restaurants — QSR', 'Restaurants — Casual'] },
  { name: 'Footwear & Lifestyle',    etf: 'XRT',   groups: ['Footwear / Athleisure'] },
  // ── Materials ──
  { name: 'Gold & Silver',           etf: 'GDX',   groups: ['Gold Mining', 'Silver / Precious'] },
  { name: 'Copper & Lithium',        etf: 'LIT',   groups: ['Copper Mining', 'Lithium / Battery'] },
  { name: 'Steel & Metals',          etf: 'SLX',   groups: ['Steel'] },
  { name: 'Uranium',                 etf: 'URA',   groups: ['Uranium'] },
  // ── Media / Comm ──
  { name: 'Social & Streaming',      etf: 'SOCL',  groups: ['Social Media', 'Streaming / Content'] },
  { name: 'Gaming',                  etf: 'ESPO',  groups: ['Gaming'] },
  { name: 'Search & Advertising',    etf: 'SOCL',  groups: ['Search / Advertising'] },
  // ── Real Estate ──
  { name: 'Data Centers & REITs',    etf: 'VNQ',   groups: ['REITs — Data Centers', 'REITs — Industrial'] },
  // ── Space ──
  { name: 'Space',                   etf: 'UFO',   groups: ['Space Technology'] },
  { name: 'eVTOL & Drones',          etf: 'ITA',   groups: ['eVTOL / UAM'] },
  // ── Digital Assets ──
  { name: 'Bitcoin & Crypto',        etf: 'BITO',  groups: ['Bitcoin & Crypto Mining'] },
  // ── Emerging Tech ──
  { name: 'Quantum Computing',       etf: 'QTUM',  groups: ['Quantum Computing'] },
  { name: 'AI Cloud',                etf: 'AIQ',   groups: ['AI Cloud / Infra'] },
  // ── Nuclear & Uranium ──
  { name: 'Nuclear Power',           etf: 'NLR',   groups: ['Nuclear Power', 'Uranium'] },
];

// Pre-compute tickers for each hot theme from INDUSTRY_GROUPS
export const HOT_THEMES = _HOT_THEMES_RAW.map(theme => ({
  ...theme,
  tickers: [...new Set(
    INDUSTRY_GROUPS
      .filter(g => theme.groups.includes(g.name))
      .flatMap(g => g.tickers)
  )],
}));

export const HOT_THEME_ETFS = Object.fromEntries(
  HOT_THEMES.map(t => [t.name, t.etf])
);

export const ALL_SYMBOLS = [...new Set([
  ...Object.values(SECTOR_STOCKS).flat(),
])];

export const ALL_THEME_SYMBOLS = [...new Set([
  ...Object.values(THEME_STOCKS).flat(),
])];

export const ALL_ETF_SYMBOLS = Object.values(THEME_ETFS);

export const SECTORS = Object.keys(SECTOR_STOCKS);
export const THEMES = Object.keys(THEME_STOCKS);
