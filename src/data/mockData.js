// Mock data generator for realistic stock market simulation

export const SECTORS = [
  'Technology', 'Energy', 'Healthcare', 'Financials',
  'Consumer Discretionary', 'Industrials', 'Materials',
  'Utilities', 'Real Estate', 'Communication Services', 'Consumer Staples'
];

export const THEMES = [
  'Software', 'Cyber Security', 'Semiconductors', 'Biotech',
  'Clean Energy', 'AI & Machine Learning', 'Cloud Computing',
  'Defense', 'Fintech', 'EV & Battery'
];

const SECTOR_STOCKS = {
  'Technology': [
    { ticker: 'NVDA', name: 'NVIDIA Corp' },
    { ticker: 'AAPL', name: 'Apple Inc' },
    { ticker: 'MSFT', name: 'Microsoft Corp' },
    { ticker: 'AVGO', name: 'Broadcom Inc' },
    { ticker: 'ORCL', name: 'Oracle Corp' },
    { ticker: 'CRM', name: 'Salesforce Inc' },
    { ticker: 'AMD', name: 'Advanced Micro Devices' },
    { ticker: 'INTC', name: 'Intel Corp' },
    { ticker: 'QCOM', name: 'Qualcomm Inc' },
    { ticker: 'TXN', name: 'Texas Instruments' },
    { ticker: 'MU', name: 'Micron Technology' },
    { ticker: 'AMAT', name: 'Applied Materials' },
    { ticker: 'KLAC', name: 'KLA Corp' },
    { ticker: 'LRCX', name: 'Lam Research' },
    { ticker: 'SNPS', name: 'Synopsys Inc' },
    { ticker: 'CDNS', name: 'Cadence Design' },
    { ticker: 'NOW', name: 'ServiceNow Inc' },
    { ticker: 'ADBE', name: 'Adobe Inc' },
    { ticker: 'INTU', name: 'Intuit Inc' },
    { ticker: 'FTNT', name: 'Fortinet Inc' },
  ],
  'Energy': [
    { ticker: 'XOM', name: 'Exxon Mobil' },
    { ticker: 'CVX', name: 'Chevron Corp' },
    { ticker: 'COP', name: 'ConocoPhillips' },
    { ticker: 'EOG', name: 'EOG Resources' },
    { ticker: 'SLB', name: 'Schlumberger NV' },
    { ticker: 'MPC', name: 'Marathon Petroleum' },
    { ticker: 'PSX', name: 'Phillips 66' },
    { ticker: 'VLO', name: 'Valero Energy' },
    { ticker: 'PXD', name: 'Pioneer Natural' },
    { ticker: 'DVN', name: 'Devon Energy' },
    { ticker: 'FANG', name: 'Diamondback Energy' },
    { ticker: 'HAL', name: 'Halliburton Co' },
    { ticker: 'BKR', name: 'Baker Hughes' },
    { ticker: 'OXY', name: 'Occidental Petroleum' },
    { ticker: 'HES', name: 'Hess Corp' },
    { ticker: 'APA', name: 'APA Corp' },
    { ticker: 'MRO', name: 'Marathon Oil' },
    { ticker: 'CTRA', name: 'Coterra Energy' },
    { ticker: 'PR', name: 'Permian Resources' },
    { ticker: 'NOV', name: 'NOV Inc' },
  ],
  'Healthcare': [
    { ticker: 'LLY', name: 'Eli Lilly & Co' },
    { ticker: 'UNH', name: 'UnitedHealth Group' },
    { ticker: 'JNJ', name: 'Johnson & Johnson' },
    { ticker: 'ABBV', name: 'AbbVie Inc' },
    { ticker: 'MRK', name: 'Merck & Co' },
    { ticker: 'TMO', name: 'Thermo Fisher' },
    { ticker: 'ABT', name: 'Abbott Labs' },
    { ticker: 'DHR', name: 'Danaher Corp' },
    { ticker: 'PFE', name: 'Pfizer Inc' },
    { ticker: 'BMY', name: 'Bristol-Myers Squibb' },
    { ticker: 'AMGN', name: 'Amgen Inc' },
    { ticker: 'GILD', name: 'Gilead Sciences' },
    { ticker: 'REGN', name: 'Regeneron Pharma' },
    { ticker: 'ISRG', name: 'Intuitive Surgical' },
    { ticker: 'VRTX', name: 'Vertex Pharmaceuticals' },
    { ticker: 'MDT', name: 'Medtronic PLC' },
    { ticker: 'EW', name: 'Edwards Lifesciences' },
    { ticker: 'HCA', name: 'HCA Healthcare' },
    { ticker: 'CI', name: 'Cigna Group' },
    { ticker: 'CVS', name: 'CVS Health' },
  ],
  'Financials': [
    { ticker: 'BRK.B', name: 'Berkshire Hathaway' },
    { ticker: 'JPM', name: 'JPMorgan Chase' },
    { ticker: 'V', name: 'Visa Inc' },
    { ticker: 'MA', name: 'Mastercard Inc' },
    { ticker: 'BAC', name: 'Bank of America' },
    { ticker: 'WFC', name: 'Wells Fargo' },
    { ticker: 'GS', name: 'Goldman Sachs' },
    { ticker: 'MS', name: 'Morgan Stanley' },
    { ticker: 'SCHW', name: 'Charles Schwab' },
    { ticker: 'AXP', name: 'American Express' },
    { ticker: 'BLK', name: 'BlackRock Inc' },
    { ticker: 'CB', name: 'Chubb Ltd' },
    { ticker: 'SPGI', name: 'S&P Global' },
    { ticker: 'ICE', name: 'Intercontinental Exchange' },
    { ticker: 'CME', name: 'CME Group' },
    { ticker: 'PGR', name: 'Progressive Corp' },
    { ticker: 'AON', name: 'Aon PLC' },
    { ticker: 'TRV', name: 'Travelers Companies' },
    { ticker: 'USB', name: 'U.S. Bancorp' },
    { ticker: 'PNC', name: 'PNC Financial' },
  ],
  'Consumer Discretionary': [
    { ticker: 'AMZN', name: 'Amazon.com Inc' },
    { ticker: 'TSLA', name: 'Tesla Inc' },
    { ticker: 'HD', name: 'Home Depot' },
    { ticker: 'MCD', name: "McDonald's Corp" },
    { ticker: 'NKE', name: 'Nike Inc' },
    { ticker: 'LOW', name: "Lowe's Companies" },
    { ticker: 'SBUX', name: 'Starbucks Corp' },
    { ticker: 'TJX', name: 'TJX Companies' },
    { ticker: 'BKNG', name: 'Booking Holdings' },
    { ticker: 'CMG', name: 'Chipotle Mexican Grill' },
    { ticker: 'GM', name: 'General Motors' },
    { ticker: 'F', name: 'Ford Motor' },
    { ticker: 'ROST', name: 'Ross Stores' },
    { ticker: 'ORLY', name: "O'Reilly Automotive" },
    { ticker: 'AZO', name: 'AutoZone Inc' },
    { ticker: 'DHI', name: 'D.R. Horton' },
    { ticker: 'LEN', name: 'Lennar Corp' },
    { ticker: 'YUM', name: 'Yum! Brands' },
    { ticker: 'DRI', name: 'Darden Restaurants' },
    { ticker: 'EBAY', name: 'eBay Inc' },
  ],
  'Industrials': [
    { ticker: 'GE', name: 'GE Aerospace' },
    { ticker: 'CAT', name: 'Caterpillar Inc' },
    { ticker: 'UNP', name: 'Union Pacific' },
    { ticker: 'HON', name: 'Honeywell Intl' },
    { ticker: 'RTX', name: 'RTX Corp' },
    { ticker: 'LMT', name: 'Lockheed Martin' },
    { ticker: 'UPS', name: 'United Parcel Service' },
    { ticker: 'DE', name: 'Deere & Co' },
    { ticker: 'BA', name: 'Boeing Co' },
    { ticker: 'GEV', name: 'GE Vernova' },
    { ticker: 'NOC', name: 'Northrop Grumman' },
    { ticker: 'GD', name: 'General Dynamics' },
    { ticker: 'FDX', name: 'FedEx Corp' },
    { ticker: 'CSX', name: 'CSX Corp' },
    { ticker: 'EMR', name: 'Emerson Electric' },
    { ticker: 'ETN', name: 'Eaton Corp' },
    { ticker: 'PH', name: 'Parker-Hannifin' },
    { ticker: 'MMM', name: '3M Company' },
    { ticker: 'IR', name: 'Ingersoll Rand' },
    { ticker: 'CTAS', name: 'Cintas Corp' },
  ],
  'Materials': [
    { ticker: 'LIN', name: 'Linde PLC' },
    { ticker: 'APD', name: 'Air Products' },
    { ticker: 'SHW', name: 'Sherwin-Williams' },
    { ticker: 'FCX', name: 'Freeport-McMoRan' },
    { ticker: 'NEM', name: 'Newmont Corp' },
    { ticker: 'ECL', name: 'Ecolab Inc' },
    { ticker: 'NUE', name: 'Nucor Corp' },
    { ticker: 'VMC', name: 'Vulcan Materials' },
    { ticker: 'MLM', name: 'Martin Marietta' },
    { ticker: 'DOW', name: 'Dow Inc' },
    { ticker: 'DD', name: 'DuPont de Nemours' },
    { ticker: 'PPG', name: 'PPG Industries' },
    { ticker: 'IP', name: 'International Paper' },
    { ticker: 'WRK', name: 'WestRock' },
    { ticker: 'ALB', name: 'Albemarle Corp' },
    { ticker: 'CF', name: 'CF Industries' },
    { ticker: 'MOS', name: 'Mosaic Co' },
    { ticker: 'RS', name: 'Reliance Steel' },
    { ticker: 'STLD', name: 'Steel Dynamics' },
    { ticker: 'X', name: 'U.S. Steel' },
  ],
  'Utilities': [
    { ticker: 'NEE', name: 'NextEra Energy' },
    { ticker: 'SO', name: 'Southern Co' },
    { ticker: 'DUK', name: 'Duke Energy' },
    { ticker: 'SRE', name: 'Sempra' },
    { ticker: 'AEP', name: 'American Electric Power' },
    { ticker: 'EXC', name: 'Exelon Corp' },
    { ticker: 'XEL', name: 'Xcel Energy' },
    { ticker: 'D', name: 'Dominion Energy' },
    { ticker: 'ED', name: 'Consolidated Edison' },
    { ticker: 'ETR', name: 'Entergy Corp' },
    { ticker: 'AWK', name: 'American Water Works' },
    { ticker: 'WEC', name: 'WEC Energy' },
    { ticker: 'ES', name: 'Eversource Energy' },
    { ticker: 'ATO', name: 'Atmos Energy' },
    { ticker: 'LNT', name: 'Alliant Energy' },
    { ticker: 'PNW', name: 'Pinnacle West' },
    { ticker: 'NI', name: 'NiSource Inc' },
    { ticker: 'CMS', name: 'CMS Energy' },
    { ticker: 'PPL', name: 'PPL Corp' },
    { ticker: 'OGE', name: 'OGE Energy' },
  ],
  'Real Estate': [
    { ticker: 'PLD', name: 'Prologis Inc' },
    { ticker: 'AMT', name: 'American Tower' },
    { ticker: 'EQIX', name: 'Equinix Inc' },
    { ticker: 'CCI', name: 'Crown Castle' },
    { ticker: 'PSA', name: 'Public Storage' },
    { ticker: 'WELL', name: 'Welltower Inc' },
    { ticker: 'O', name: 'Realty Income' },
    { ticker: 'DLR', name: 'Digital Realty' },
    { ticker: 'AVB', name: 'AvalonBay Communities' },
    { ticker: 'EQR', name: 'Equity Residential' },
    { ticker: 'SBAC', name: 'SBA Communications' },
    { ticker: 'ARE', name: 'Alexandria RE Equities' },
    { ticker: 'MAA', name: 'Mid-America Apt' },
    { ticker: 'VTR', name: 'Ventas Inc' },
    { ticker: 'EXR', name: 'Extra Space Storage' },
    { ticker: 'KIM', name: 'Kimco Realty' },
    { ticker: 'REG', name: 'Regency Centers' },
    { ticker: 'WPC', name: 'W. P. Carey Inc' },
    { ticker: 'IRM', name: 'Iron Mountain' },
    { ticker: 'NNN', name: 'NNN REIT' },
  ],
  'Communication Services': [
    { ticker: 'META', name: 'Meta Platforms' },
    { ticker: 'GOOGL', name: 'Alphabet Inc A' },
    { ticker: 'NFLX', name: 'Netflix Inc' },
    { ticker: 'DIS', name: 'Walt Disney Co' },
    { ticker: 'CMCSA', name: 'Comcast Corp' },
    { ticker: 'T', name: 'AT&T Inc' },
    { ticker: 'VZ', name: 'Verizon Comms' },
    { ticker: 'TMUS', name: 'T-Mobile US' },
    { ticker: 'CHTR', name: 'Charter Communications' },
    { ticker: 'SNAP', name: 'Snap Inc' },
    { ticker: 'PINS', name: 'Pinterest Inc' },
    { ticker: 'MTCH', name: 'Match Group' },
    { ticker: 'WBD', name: 'Warner Bros Discovery' },
    { ticker: 'PARA', name: 'Paramount Global' },
    { ticker: 'EA', name: 'Electronic Arts' },
    { ticker: 'TTWO', name: 'Take-Two Interactive' },
    { ticker: 'RBLX', name: 'Roblox Corp' },
    { ticker: 'SPOT', name: 'Spotify Technology' },
    { ticker: 'ZG', name: 'Zillow Group' },
    { ticker: 'IAC', name: 'IAC Inc' },
  ],
  'Consumer Staples': [
    { ticker: 'WMT', name: 'Walmart Inc' },
    { ticker: 'PG', name: 'Procter & Gamble' },
    { ticker: 'COST', name: 'Costco Wholesale' },
    { ticker: 'KO', name: 'Coca-Cola Co' },
    { ticker: 'PEP', name: 'PepsiCo Inc' },
    { ticker: 'PM', name: 'Philip Morris' },
    { ticker: 'MO', name: 'Altria Group' },
    { ticker: 'MDLZ', name: 'Mondelez Intl' },
    { ticker: 'CL', name: 'Colgate-Palmolive' },
    { ticker: 'KMB', name: 'Kimberly-Clark' },
    { ticker: 'GIS', name: 'General Mills' },
    { ticker: 'K', name: 'Kellanova' },
    { ticker: 'HSY', name: 'Hershey Co' },
    { ticker: 'CHD', name: 'Church & Dwight' },
    { ticker: 'CLX', name: 'Clorox Co' },
    { ticker: 'SJM', name: 'J.M. Smucker' },
    { ticker: 'CAG', name: 'Conagra Brands' },
    { ticker: 'CPB', name: "Campbell's Co" },
    { ticker: 'TAP', name: 'Molson Coors' },
    { ticker: 'ADM', name: 'Archer-Daniels-Midland' },
  ],
};

const THEME_STOCKS = {
  'Software': [
    { ticker: 'MSFT', name: 'Microsoft Corp' },
    { ticker: 'CRM', name: 'Salesforce Inc' },
    { ticker: 'NOW', name: 'ServiceNow Inc' },
    { ticker: 'ORCL', name: 'Oracle Corp' },
    { ticker: 'ADBE', name: 'Adobe Inc' },
    { ticker: 'INTU', name: 'Intuit Inc' },
    { ticker: 'WDAY', name: 'Workday Inc' },
    { ticker: 'PANW', name: 'Palo Alto Networks' },
    { ticker: 'CDNS', name: 'Cadence Design' },
    { ticker: 'SNPS', name: 'Synopsys Inc' },
    { ticker: 'DDOG', name: 'Datadog Inc' },
    { ticker: 'SNOW', name: 'Snowflake Inc' },
    { ticker: 'MDB', name: 'MongoDB Inc' },
    { ticker: 'HUBS', name: 'HubSpot Inc' },
    { ticker: 'VEEV', name: 'Veeva Systems' },
    { ticker: 'ZI', name: 'ZoomInfo Tech' },
    { ticker: 'GTLB', name: 'GitLab Inc' },
    { ticker: 'BILL', name: 'Bill.com Holdings' },
    { ticker: 'APPF', name: 'AppFolio Inc' },
    { ticker: 'ALTR', name: 'Altair Engineering' },
  ],
  'Cyber Security': [
    { ticker: 'PANW', name: 'Palo Alto Networks' },
    { ticker: 'CRWD', name: 'CrowdStrike Holdings' },
    { ticker: 'FTNT', name: 'Fortinet Inc' },
    { ticker: 'ZS', name: 'Zscaler Inc' },
    { ticker: 'S', name: 'SentinelOne Inc' },
    { ticker: 'CYBR', name: 'CyberArk Software' },
    { ticker: 'OKTA', name: 'Okta Inc' },
    { ticker: 'CHKP', name: 'Check Point Software' },
    { ticker: 'NET', name: 'Cloudflare Inc' },
    { ticker: 'TENB', name: 'Tenable Holdings' },
    { ticker: 'RPD', name: 'Rapid7 Inc' },
    { ticker: 'QLYS', name: 'Qualys Inc' },
    { ticker: 'VRNS', name: 'Varonis Systems' },
    { ticker: 'DDOG', name: 'Datadog Inc' },
    { ticker: 'SAIL', name: 'SailPoint Tech' },
    { ticker: 'IHAWK', name: 'IronHawk Security' },
    { ticker: 'SAIC', name: 'SAIC Inc' },
    { ticker: 'LDOS', name: 'Leidos Holdings' },
    { ticker: 'CACI', name: 'CACI International' },
    { ticker: 'MNDT', name: 'Mandiant Inc' },
  ],
  'Semiconductors': [
    { ticker: 'NVDA', name: 'NVIDIA Corp' },
    { ticker: 'AVGO', name: 'Broadcom Inc' },
    { ticker: 'AMD', name: 'Advanced Micro Devices' },
    { ticker: 'QCOM', name: 'Qualcomm Inc' },
    { ticker: 'TXN', name: 'Texas Instruments' },
    { ticker: 'AMAT', name: 'Applied Materials' },
    { ticker: 'MU', name: 'Micron Technology' },
    { ticker: 'KLAC', name: 'KLA Corp' },
    { ticker: 'LRCX', name: 'Lam Research' },
    { ticker: 'MRVL', name: 'Marvell Technology' },
    { ticker: 'ON', name: 'ON Semiconductor' },
    { ticker: 'MPWR', name: 'Monolithic Power' },
    { ticker: 'WOLF', name: 'Wolfspeed Inc' },
    { ticker: 'ENTG', name: 'Entegris Inc' },
    { ticker: 'SITM', name: 'SiTime Corp' },
    { ticker: 'ALGM', name: 'Allegro MicroSystems' },
    { ticker: 'CRUS', name: 'Cirrus Logic' },
    { ticker: 'SWKS', name: 'Skyworks Solutions' },
    { ticker: 'QRVO', name: 'Qorvo Inc' },
    { ticker: 'ADI', name: 'Analog Devices' },
  ],
  'Biotech': [
    { ticker: 'BIIB', name: 'Biogen Inc' },
    { ticker: 'REGN', name: 'Regeneron Pharma' },
    { ticker: 'VRTX', name: 'Vertex Pharmaceuticals' },
    { ticker: 'GILD', name: 'Gilead Sciences' },
    { ticker: 'MRNA', name: 'Moderna Inc' },
    { ticker: 'BNTX', name: 'BioNTech SE' },
    { ticker: 'ALNY', name: 'Alnylam Pharma' },
    { ticker: 'SGEN', name: 'Seagen Inc' },
    { ticker: 'EXAS', name: 'Exact Sciences' },
    { ticker: 'INCY', name: 'Incyte Corp' },
    { ticker: 'BMRN', name: 'BioMarin Pharma' },
    { ticker: 'SRPT', name: 'Sarepta Therapeutics' },
    { ticker: 'RARE', name: 'Ultragenyx Pharma' },
    { ticker: 'ARWR', name: 'Arrowhead Pharma' },
    { ticker: 'RCUS', name: 'Arcus Biosciences' },
    { ticker: 'AGEN', name: 'Agenus Inc' },
    { ticker: 'FATE', name: 'Fate Therapeutics' },
    { ticker: 'KRTX', name: 'Karuna Therapeutics' },
    { ticker: 'RXRX', name: 'Recursion Pharma' },
    { ticker: 'BEAM', name: 'Beam Therapeutics' },
  ],
  'Clean Energy': [
    { ticker: 'NEE', name: 'NextEra Energy' },
    { ticker: 'ENPH', name: 'Enphase Energy' },
    { ticker: 'SEDG', name: 'SolarEdge Tech' },
    { ticker: 'RUN', name: 'Sunrun Inc' },
    { ticker: 'FSLR', name: 'First Solar Inc' },
    { ticker: 'BE', name: 'Bloom Energy' },
    { ticker: 'PLUG', name: 'Plug Power Inc' },
    { ticker: 'CSIQ', name: 'Canadian Solar' },
    { ticker: 'ARRY', name: 'Array Technologies' },
    { ticker: 'NOVA', name: 'Sunnova Energy' },
    { ticker: 'SPWR', name: 'SunPower Corp' },
    { ticker: 'AZRE', name: 'Azure Power' },
    { ticker: 'CWEN', name: 'Clearway Energy' },
    { ticker: 'AES', name: 'AES Corp' },
    { ticker: 'BEP', name: 'Brookfield Renewable' },
    { ticker: 'REGI', name: 'Renewable Energy Group' },
    { ticker: 'AMRC', name: 'Ameresco Inc' },
    { ticker: 'HASI', name: 'HA Sustainable Infra' },
    { ticker: 'CLNE', name: 'Clean Energy Fuels' },
    { ticker: 'GPRE', name: 'Green Plains Inc' },
  ],
  'AI & Machine Learning': [
    { ticker: 'NVDA', name: 'NVIDIA Corp' },
    { ticker: 'MSFT', name: 'Microsoft Corp' },
    { ticker: 'GOOGL', name: 'Alphabet Inc' },
    { ticker: 'META', name: 'Meta Platforms' },
    { ticker: 'AMZN', name: 'Amazon.com Inc' },
    { ticker: 'IBM', name: 'IBM Corp' },
    { ticker: 'PLTR', name: 'Palantir Technologies' },
    { ticker: 'AI', name: 'C3.ai Inc' },
    { ticker: 'BBAI', name: 'BigBear.ai Holdings' },
    { ticker: 'SOUN', name: 'SoundHound AI' },
    { ticker: 'UPST', name: 'Upstart Holdings' },
    { ticker: 'PATH', name: 'UiPath Inc' },
    { ticker: 'AMBA', name: 'Ambarella Inc' },
    { ticker: 'IDAI', name: 'iDAI' },
    { ticker: 'ACMR', name: 'ACM Research' },
    { ticker: 'ARQQ', name: 'Arqit Quantum' },
    { ticker: 'IONQ', name: 'IonQ Inc' },
    { ticker: 'QUBT', name: 'Quantum Computing' },
    { ticker: 'RGTI', name: 'Rigetti Computing' },
    { ticker: 'CXAI', name: 'CXApp Inc' },
  ],
  'Cloud Computing': [
    { ticker: 'AMZN', name: 'Amazon.com (AWS)' },
    { ticker: 'MSFT', name: 'Microsoft (Azure)' },
    { ticker: 'GOOGL', name: 'Alphabet (GCP)' },
    { ticker: 'CRM', name: 'Salesforce Inc' },
    { ticker: 'NOW', name: 'ServiceNow Inc' },
    { ticker: 'SNOW', name: 'Snowflake Inc' },
    { ticker: 'DDOG', name: 'Datadog Inc' },
    { ticker: 'NET', name: 'Cloudflare Inc' },
    { ticker: 'ZS', name: 'Zscaler Inc' },
    { ticker: 'TWLO', name: 'Twilio Inc' },
    { ticker: 'MDB', name: 'MongoDB Inc' },
    { ticker: 'ESTC', name: 'Elastic NV' },
    { ticker: 'PD', name: 'PagerDuty Inc' },
    { ticker: 'ZEN', name: 'Zendesk Inc' },
    { ticker: 'BOX', name: 'Box Inc' },
    { ticker: 'NCNO', name: 'nCino Inc' },
    { ticker: 'CFLT', name: 'Confluent Inc' },
    { ticker: 'GTLB', name: 'GitLab Inc' },
    { ticker: 'DOCN', name: 'DigitalOcean' },
    { ticker: 'FSLY', name: 'Fastly Inc' },
  ],
  'Defense': [
    { ticker: 'LMT', name: 'Lockheed Martin' },
    { ticker: 'RTX', name: 'RTX Corp' },
    { ticker: 'NOC', name: 'Northrop Grumman' },
    { ticker: 'GD', name: 'General Dynamics' },
    { ticker: 'BA', name: 'Boeing Co' },
    { ticker: 'HII', name: 'Huntington Ingalls' },
    { ticker: 'L3H', name: 'L3Harris Technologies' },
    { ticker: 'TDG', name: 'TransDigm Group' },
    { ticker: 'HEI', name: 'HEICO Corp' },
    { ticker: 'LDOS', name: 'Leidos Holdings' },
    { ticker: 'SAIC', name: 'SAIC Inc' },
    { ticker: 'CACI', name: 'CACI International' },
    { ticker: 'BWXT', name: 'BWX Technologies' },
    { ticker: 'VSAT', name: 'Viasat Inc' },
    { ticker: 'KTOS', name: 'Kratos Defense' },
    { ticker: 'MOOG', name: 'Moog Inc' },
    { ticker: 'DRS', name: 'Leonardo DRS' },
    { ticker: 'FLIR', name: 'FLIR Systems' },
    { ticker: 'VSE', name: 'VSE Corp' },
    { ticker: 'MRCY', name: 'Mercury Systems' },
  ],
  'Fintech': [
    { ticker: 'V', name: 'Visa Inc' },
    { ticker: 'MA', name: 'Mastercard Inc' },
    { ticker: 'PYPL', name: 'PayPal Holdings' },
    { ticker: 'SQ', name: 'Block Inc' },
    { ticker: 'AFRM', name: 'Affirm Holdings' },
    { ticker: 'SOFI', name: 'SoFi Technologies' },
    { ticker: 'UPST', name: 'Upstart Holdings' },
    { ticker: 'HOOD', name: 'Robinhood Markets' },
    { ticker: 'COIN', name: 'Coinbase Global' },
    { ticker: 'MSTR', name: 'MicroStrategy Inc' },
    { ticker: 'NRDS', name: 'NerdWallet Inc' },
    { ticker: 'OPEN', name: 'Opendoor Technologies' },
    { ticker: 'CLOV', name: 'Clover Health' },
    { ticker: 'LMND', name: 'Lemonade Inc' },
    { ticker: 'ROOT', name: 'Root Inc' },
    { ticker: 'IIIV', name: 'i2c Inc' },
    { ticker: 'RELY', name: 'Remitly Global' },
    { ticker: 'FLYW', name: 'Flywire Corp' },
    { ticker: 'RPAY', name: 'Repay Holdings' },
    { ticker: 'PRFT', name: 'Perficient Inc' },
  ],
  'EV & Battery': [
    { ticker: 'TSLA', name: 'Tesla Inc' },
    { ticker: 'RIVN', name: 'Rivian Automotive' },
    { ticker: 'LCID', name: 'Lucid Group' },
    { ticker: 'NIO', name: 'NIO Inc' },
    { ticker: 'XPEV', name: 'XPeng Inc' },
    { ticker: 'LI', name: 'Li Auto Inc' },
    { ticker: 'F', name: 'Ford Motor (EV)' },
    { ticker: 'GM', name: 'General Motors (EV)' },
    { ticker: 'ALB', name: 'Albemarle Corp' },
    { ticker: 'LAC', name: 'Lithium Americas' },
    { ticker: 'SQM', name: 'Sociedad Quimica' },
    { ticker: 'LTHM', name: 'Livent Corp' },
    { ticker: 'MP', name: 'MP Materials' },
    { ticker: 'PTRA', name: 'Proterra Inc' },
    { ticker: 'FSR', name: 'Fisker Inc' },
    { ticker: 'WKHS', name: 'Workhorse Group' },
    { ticker: 'NKLA', name: 'Nikola Corp' },
    { ticker: 'QS', name: 'QuantumScape Corp' },
    { ticker: 'ASTS', name: 'AST SpaceMobile' },
    { ticker: 'MVST', name: 'Microvast Holdings' },
  ],
};

// Seeded random for consistency
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getStage(seed) {
  const r = seededRandom(seed);
  if (r < 0.25) return 'S1';
  if (r < 0.55) return 'S2';
  if (r < 0.70) return 'S3';
  return 'S4';
}

function generateStockData(ticker, name, index) {
  const seed = ticker.charCodeAt(0) * 100 + ticker.charCodeAt(ticker.length - 1) + index;
  const price = Math.round((seededRandom(seed) * 480 + 20) * 100) / 100;
  const change = Math.round((seededRandom(seed + 1) * 12 - 6) * 100) / 100;
  const rs = Math.round(seededRandom(seed + 2) * 98 + 1);
  const volBuzz = Math.round(seededRandom(seed + 3) * 30 + 0.3 * 10) / 10;
  const distSma50 = Math.round((seededRandom(seed + 4) * 40 - 20) * 100) / 100;
  const stage = getStage(seed + 5);
  return { ticker, name, price, change, rs, volBuzz, distSma50, stage };
}

export function getLeadersForSector(sectorOrTheme) {
  const stockList = SECTOR_STOCKS[sectorOrTheme] || THEME_STOCKS[sectorOrTheme] || [];
  return stockList
    .map((s, i) => generateStockData(s.ticker, s.name, i))
    .sort((a, b) => b.rs - a.rs);
}

export function generateSectorData() {
  return SECTORS.map((sector, si) => {
    const seed = si * 77 + 13;
    const s2 = Math.round(seededRandom(seed) * 40 + 10);
    const s4 = Math.round(seededRandom(seed + 1) * 30 + 5);
    const s3 = Math.round(seededRandom(seed + 2) * 20 + 5);
    const s1 = 100 - s2 - s4 - s3;
    const health = s2 > 40 ? 'Strong' : s2 > 25 ? 'Healthy' : 'Weak';
    return { sector, s1: Math.max(s1, 5), s2, s3, s4, health };
  });
}

export function generateThemeData() {
  return THEMES.map((theme, ti) => {
    const seed = ti * 53 + 7;
    const w1 = Math.round((seededRandom(seed) * 20 - 10) * 10) / 10;
    const m1 = Math.round((seededRandom(seed + 1) * 40 - 20) * 10) / 10;
    const ytd = Math.round((seededRandom(seed + 2) * 60 - 30) * 10) / 10;
    return { theme, w1, m1, ytd };
  });
}

export function generateMarketBreadth() {
  return {
    newHighs: 50,
    newLows: 75,
    advancing: 913,
    declining: 1434,
    unchanged: 124,
    pctUp: 46,
    pctDown: 54,
    pctUnchanged: 3.3,
    upFromOpen: 1338,
    downFromOpen: 1546,
    pctVolUp: 42,
    upOnVol: 169,
    downOnVol: 230,
    pctUp4: 48,
    up4: 237,
    down4: 252,
  };
}

export function generateStageHistory() {
  const days = 20;
  return Array.from({ length: days }, (_, i) => {
    const seed = i * 31 + 11;
    const s2 = Math.round(seededRandom(seed) * 15 + 30);
    const s4 = Math.round(seededRandom(seed + 1) * 10 + 15);
    const s3 = Math.round(seededRandom(seed + 2) * 8 + 10);
    const s1 = 100 - s2 - s4 - s3;
    const date = new Date(2026, 2, i + 1);
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      S1: Math.max(s1, 5), S2: s2, S3: s3, S4: s4
    };
  });
}

export function generateOverallStageDistribution() {
  return { S1: 22, S2: 38, S3: 18, S4: 22 };
}

// Simulate small live updates
export function applyLiveUpdate(data) {
  return data.map(stock => ({
    ...stock,
    price: Math.round((stock.price + (Math.random() * 2 - 1)) * 100) / 100,
    change: Math.round((stock.change + (Math.random() * 0.4 - 0.2)) * 100) / 100,
    volBuzz: Math.round((stock.volBuzz + (Math.random() * 0.2 - 0.1)) * 10) / 10,
  }));
}
