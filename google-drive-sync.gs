const SYNC_TOKEN = "dudcjf11!!";
const FOLDER_ID = "";
const FILE_NAME = "aisis-mobile-state.json";
const SCREENING_FILE_NAME = "aisis-mobile-screening-cache.json";
const NASDAQ_FULL_BATCH_SIZE = 500;
const FAIR_VALUE_WEIGHTS = {
  dcf_value: 0.30,
  per_value: 0.25,
  peg_value: 0.15,
  pbr_roe_value: 0.10,
  ev_ebitda_value: 0.10,
  technical_value: 0.10
};
const SCREENING_TIERS = [
  {
    id: "full_nightly",
    label: "\uCF54\uC2A4\uD53C \uC804\uCCB4 \uBD84\uC11D",
    scope: "\uCF54\uC2A4\uD53C \uC804\uCCB4",
    limit: null,
    intervalMs: 24 * 60 * 60 * 1000,
    mode: "summary",
    modeLabel: "\uC804\uCCB4 \uC810\uC218",
    windowStartHour: 20,
    windowEndHour: 8
  },
  {
    id: "top_200_hourly",
    label: "\uC810\uC218 \uC0C1\uC704 200\uAC1C",
    scope: "\uC804\uCCB4 \uBD84\uC11D \uC810\uC218 \uC0C1\uC704 200\uAC1C",
    limit: 200,
    intervalMs: 60 * 60 * 1000,
    mode: "deep",
    modeLabel: "\uC2EC\uCE35 \uBD84\uC11D",
    batchSize: 12,
    sourceTierId: "full_nightly"
  },
  {
    id: "top_50_5min",
    label: "\uC810\uC218 \uC0C1\uC704 50\uAC1C",
    scope: "200\uAC1C \uBD84\uC11D \uACB0\uACFC \uC911 \uC810\uC218 \uC0C1\uC704 50\uAC1C",
    limit: 50,
    intervalMs: 5 * 60 * 1000,
    mode: "deep",
    modeLabel: "\uC9D1\uC911 \uBD84\uC11D",
    batchSize: 8,
    sourceTierId: "top_200_hourly"
  },
  {
    id: "top_20_realtime",
    label: "\uC810\uC218 \uC0C1\uC704 20\uAC1C",
    scope: "50\uAC1C \uBD84\uC11D \uACB0\uACFC \uC911 \uC810\uC218 \uC0C1\uC704 20\uAC1C",
    limit: 20,
    intervalMs: 30 * 1000,
    mode: "light",
    modeLabel: "\uCD08\uB2E8\uC704 \uAC00\uACA9 \uBAA8\uB2C8\uD130\uB9C1",
    sourceTierId: "top_50_5min"
  }
];
const NASDAQ_BASE_STOCKS = [
  { ticker: "AAPL", name: "Apple" },
  { ticker: "MSFT", name: "Microsoft" },
  { ticker: "NVDA", name: "NVIDIA" },
  { ticker: "AMZN", name: "Amazon" },
  { ticker: "META", name: "Meta Platforms" },
  { ticker: "GOOGL", name: "Alphabet Class A" },
  { ticker: "GOOG", name: "Alphabet Class C" },
  { ticker: "AVGO", name: "Broadcom" },
  { ticker: "TSLA", name: "Tesla" },
  { ticker: "COST", name: "Costco" },
  { ticker: "NFLX", name: "Netflix" },
  { ticker: "AMD", name: "AMD" },
  { ticker: "PEP", name: "PepsiCo" },
  { ticker: "CSCO", name: "Cisco" },
  { ticker: "ADBE", name: "Adobe" },
  { ticker: "LIN", name: "Linde" },
  { ticker: "TMUS", name: "T-Mobile US" },
  { ticker: "INTU", name: "Intuit" },
  { ticker: "QCOM", name: "Qualcomm" },
  { ticker: "AMAT", name: "Applied Materials" },
  { ticker: "TXN", name: "Texas Instruments" },
  { ticker: "ISRG", name: "Intuitive Surgical" },
  { ticker: "CMCSA", name: "Comcast" },
  { ticker: "AMGN", name: "Amgen" },
  { ticker: "HON", name: "Honeywell" },
  { ticker: "BKNG", name: "Booking Holdings" },
  { ticker: "VRTX", name: "Vertex Pharmaceuticals" },
  { ticker: "PANW", name: "Palo Alto Networks" },
  { ticker: "ADP", name: "ADP" },
  { ticker: "SBUX", name: "Starbucks" },
  { ticker: "GILD", name: "Gilead Sciences" },
  { ticker: "MU", name: "Micron" },
  { ticker: "ADI", name: "Analog Devices" },
  { ticker: "LRCX", name: "Lam Research" },
  { ticker: "MELI", name: "MercadoLibre" },
  { ticker: "MDLZ", name: "Mondelez" },
  { ticker: "KLAC", name: "KLA" },
  { ticker: "REGN", name: "Regeneron" },
  { ticker: "SNPS", name: "Synopsys" },
  { ticker: "CDNS", name: "Cadence Design Systems" },
  { ticker: "CRWD", name: "CrowdStrike" },
  { ticker: "MAR", name: "Marriott" },
  { ticker: "ORLY", name: "O'Reilly Automotive" },
  { ticker: "CSX", name: "CSX" },
  { ticker: "PYPL", name: "PayPal" },
  { ticker: "ABNB", name: "Airbnb" },
  { ticker: "NXPI", name: "NXP Semiconductors" },
  { ticker: "ROP", name: "Roper Technologies" },
  { ticker: "MNST", name: "Monster Beverage" },
  { ticker: "PCAR", name: "PACCAR" },
  { ticker: "WDAY", name: "Workday" },
  { ticker: "FTNT", name: "Fortinet" },
  { ticker: "MRVL", name: "Marvell" },
  { ticker: "ADSK", name: "Autodesk" },
  { ticker: "CPRT", name: "Copart" },
  { ticker: "KDP", name: "Keurig Dr Pepper" },
  { ticker: "PAYX", name: "Paychex" },
  { ticker: "AEP", name: "American Electric Power" },
  { ticker: "CHTR", name: "Charter Communications" },
  { ticker: "KHC", name: "Kraft Heinz" },
  { ticker: "MCHP", name: "Microchip Technology" },
  { ticker: "ROST", name: "Ross Stores" },
  { ticker: "EXC", name: "Exelon" },
  { ticker: "FAST", name: "Fastenal" },
  { ticker: "CTAS", name: "Cintas" },
  { ticker: "ODFL", name: "Old Dominion Freight Line" },
  { ticker: "EA", name: "Electronic Arts" },
  { ticker: "VRSK", name: "Verisk" },
  { ticker: "IDXX", name: "IDEXX Laboratories" },
  { ticker: "BKR", name: "Baker Hughes" },
  { ticker: "XEL", name: "Xcel Energy" },
  { ticker: "GEHC", name: "GE HealthCare" },
  { ticker: "LULU", name: "Lululemon" },
  { ticker: "DDOG", name: "Datadog" },
  { ticker: "ZS", name: "Zscaler" },
  { ticker: "TEAM", name: "Atlassian" },
  { ticker: "DXCM", name: "DexCom" },
  { ticker: "BIIB", name: "Biogen" },
  { ticker: "ILMN", name: "Illumina" }
];

function doGet(e) {
  const params = e.parameter || {};
  const callback = safeCallback_(params.callback);
  if (!isAuthorized_(params.token)) {
    return output_({ ok: false, error: "unauthorized" }, callback);
  }

  const action = String(params.action || "load");
  const market = marketCode_(params.market);
  try {
    if (action === "load") return output_(loadSnapshot_(), callback);
    if (action === "quote") return output_({ ok: true, quote: fetchQuoteByMarket_(params.ticker || params.query, market) }, callback);
    if (action === "searchStocks") return output_({ ok: true, items: searchStocksByMarket_(params.query, Number(params.limit || 20), market) }, callback);
    if (action === "analyze") return output_({ ok: true, analysis: analyzeStock_(params.query || params.ticker, Number(params.seedMoney || 0), market) }, callback);
    if (action === "screenKospi" || action === "screenMarket") return output_(screenMarket_(market, Number(params.pages || 80), Number(params.limit || 200), Number(params.seedMoney || 0), params.priorityTickers || "", params.forceTier || ""), callback);
    return output_({ ok: false, error: "unknown action" }, callback);
  } catch (error) {
    if (action === "screenKospi" || action === "screenMarket") {
      return output_(screeningFallbackResponse_(market, error.message || String(error)), callback);
    }
    return output_({ ok: false, error: error.message }, callback);
  }
}

function doPost(e) {
  const params = e.parameter || {};
  if (!isAuthorized_(params.token)) {
    return output_({ ok: false, error: "unauthorized" });
  }

  const action = String(params.action || "save");
  if (action !== "save") return output_({ ok: false, error: "unknown action" });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const payloadText = params.payload || (e.postData && e.postData.contents) || "{}";
    const payload = JSON.parse(payloadText);
    const snapshot = {
      ok: true,
      updatedAt: payload.updatedAt || new Date().toISOString(),
      state: payload.state || null
    };
    if (!snapshot.state) throw new Error("state is empty");
    saveSnapshot_(snapshot);
    return output_({ ok: true, updatedAt: snapshot.updatedAt });
  } catch (error) {
    return output_({ ok: false, error: error.message });
  } finally {
    lock.releaseLock();
  }
}

function loadSnapshot_() {
  const file = getDataFile_();
  if (!file) return { ok: true, state: null, updatedAt: "" };
  const text = file.getBlob().getDataAsString("UTF-8");
  if (!text) return { ok: true, state: null, updatedAt: "" };
  const snapshot = JSON.parse(text);
  if (snapshot.state) {
    return {
      ok: true,
      state: snapshot.state,
      updatedAt: snapshot.updatedAt || snapshot.state.updatedAt || ""
    };
  }
  return { ok: true, state: snapshot, updatedAt: snapshot.updatedAt || "" };
}

function saveSnapshot_(snapshot) {
  const text = JSON.stringify({ updatedAt: snapshot.updatedAt, state: snapshot.state }, null, 2);
  const file = getDataFile_();
  if (file) {
    file.setContent(text);
  } else {
    getFolder_().createFile(FILE_NAME, text, MimeType.PLAIN_TEXT);
  }
}

function getDataFile_() {
  const files = getFolder_().getFilesByName(FILE_NAME);
  return files.hasNext() ? files.next() : null;
}

function getFolder_() {
  return FOLDER_ID ? DriveApp.getFolderById(FOLDER_ID) : DriveApp.getRootFolder();
}

function analyzeStock_(query, seedMoney, market) {
  market = marketCode_(market);
  const resolved = market === "NASDAQ" ? resolveNasdaqStock_(query) : resolveStock_(query);
  const ticker = resolved.ticker;
  const prices = market === "NASDAQ" ? fetchNasdaqDailyPrices_(ticker, 260) : fetchDailyPrices_(ticker, 260);
  const quote = market === "NASDAQ" ? fetchNasdaqQuote_(ticker) : fetchQuote_(ticker);
  let fundamental = market === "NASDAQ" ? fetchNasdaqFundamental_(ticker, quote) : fetchFundamental_(ticker);
  const currentPrice = quote.currentPrice || last_(prices).close;
  const analysisPrices = applyQuoteToDailyPrices_(prices, quote, currentPrice, market);
  fundamental = market === "NASDAQ" ? fundamental : mergeCurrentFundamentals_(ticker, currentPrice, fundamental);
  const indicators = calculateIndicators_(analysisPrices);
  applyLiveVolumeIndicators_(indicators, analysisPrices, quote);
  const fairValue = calculateFairValue_(currentPrice, indicators, fundamental);
  const finalScore = calculateFinalScore_(currentPrice, fairValue, indicators, fundamental, analysisPrices);
  const atr = indicators.atr14 || 0;
  const stopLoss = calculateStopLoss_(currentPrice, atr);
  const upside = currentPrice > 0 ? fairValue / currentPrice - 1 : 0;
  const signalDetail = generateBuySignal_(ticker, currentPrice, finalScore, indicators, fairValue, stopLoss);
  const signal = signalTone_(signalDetail, finalScore, upside);
  const recommendation = recommendationLabel_(signalDetail, finalScore);
  const buyPlan = buildBuyPlan_(currentPrice, fairValue, indicators, seedMoney);

  return {
    ticker,
    name: quote.name || resolved.name || ticker,
    market: resolved.market || market,
    currentPrice,
    previousClose: quote.previousClose || null,
    change: quote.change || null,
    changeRate: quote.changeRate || null,
    fairValue,
    finalScore,
    signal,
    signalDetail,
    recommendation,
    stopLoss,
    upside,
    indicators,
    fundamental,
    buyPlan,
    reasons: buildReasons_(finalScore, upside, indicators, fundamental),
    fetchedAt: new Date().toISOString(),
    priceFetchedAt: quote.priceFetchedAt || quote.fetchedAt || new Date().toISOString(),
    priceSource: quote.quoteSource || quote.source || "",
    source: market === "NASDAQ"
      ? ((fundamental && fundamental.source ? fundamental.source + " + " : "") + "AISIS mobile")
      : "Naver Finance" + (quote.quoteSource ? " (" + quote.quoteSource + ")" : "") + " + AISIS mobile"
  };
}

function resolveStock_(query) {
  const raw = String(query || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 6) return { ticker: digits, name: "", market: "KOSPI" };
  const found = searchStocks_(raw, 1)[0];
  if (!found) throw new Error("종목을 찾지 못했습니다. 6자리 종목코드로 다시 입력하세요.");
  return found;
}

function searchStocks_(query, limit) {
  const raw = String(query || "").trim();
  const digits = raw.replace(/\D/g, "");
  const normalized = normalizeText_(raw);
  const stocks = fetchMarketSummary_(80);
  const scored = [];
  stocks.forEach((stock) => {
    const name = normalizeText_(stock.name);
    let score = 0;
    if (digits) {
      if (stock.ticker === digits) score = 100;
      else if (digits.length >= 4 && stock.ticker.indexOf(digits) === 0) score = 90;
      else return;
    } else {
      if (normalized.length < 2) return;
      if (name === normalized) score = 100;
      else if (name.indexOf(normalized) === 0) score = 90;
      else if (name.indexOf(normalized) >= 0) score = 70;
      else return;
    }
    scored.push(Object.assign({}, stock, { _score: score }));
  });
  return scored
    .sort((a, b) => b._score - a._score || String(a.name).localeCompare(String(b.name), "ko"))
    .slice(0, Math.max(1, Math.min(Number(limit || 20), 50)))
    .map((stock) => {
      delete stock._score;
      return stock;
    });
}

function fetchQuoteByMarket_(query, market) {
  return marketCode_(market) === "NASDAQ" ? fetchNasdaqQuote_(query) : fetchQuote_(query);
}

function searchStocksByMarket_(query, limit, market) {
  return marketCode_(market) === "NASDAQ" ? searchNasdaqStocks_(query, limit) : searchStocks_(query, limit);
}

function resolveNasdaqStock_(query) {
  const raw = String(query || "").trim();
  const firstToken = normalizeNasdaqSymbol_(raw.split(/\s+/)[0]);
  if (firstToken && /^[A-Z][A-Z0-9.\-]{0,7}$/.test(firstToken)) {
    const staticMatch = NASDAQ_BASE_STOCKS.find((stock) => normalizeNasdaqSymbol_(stock.ticker) === firstToken);
    return { ticker: firstToken, name: staticMatch ? staticMatch.name : "", market: "NASDAQ" };
  }
  const baseByName = searchNasdaqBaseStocks_(raw, 1)[0];
  if (baseByName) return baseByName;
  const found = searchNasdaqStocks_(query, 1)[0];
  if (!found) throw new Error("나스닥 종목을 찾지 못했습니다. 예: AAPL, MSFT, NVDA");
  return found;
}

function searchNasdaqStocks_(query, limit) {
  const raw = String(query || "").trim();
  if (!raw) return [];
  const maxItems = Math.max(1, Math.min(Number(limit || 20), 20));
  const items = searchNasdaqBaseStocks_(raw, maxItems);
  const seen = {};
  items.forEach((item) => { seen[item.ticker] = true; });
  try {
    const url = "https://query1.finance.yahoo.com/v1/finance/search?q=" + encodeURIComponent(raw) + "&quotesCount=" + maxItems + "&newsCount=0";
    const payload = JSON.parse(fetchText_(url, "UTF-8"));
    const quotes = Array.isArray(payload.quotes) ? payload.quotes : [];
    quotes.forEach((quote) => {
      const symbol = normalizeNasdaqSymbol_(quote.symbol);
      if (!symbol || seen[symbol]) return;
      const quoteType = String(quote.quoteType || "").toUpperCase();
      const exchange = String(quote.exchange || quote.exchDisp || "").toUpperCase();
      if (quoteType && quoteType !== "EQUITY" && quoteType !== "ETF") return;
      if (exchange && exchange.indexOf("NMS") < 0 && exchange.indexOf("NGM") < 0 && exchange.indexOf("NASDAQ") < 0) return;
      seen[symbol] = true;
      items.push({
        ticker: symbol,
        name: quote.shortname || quote.longname || symbol,
        market: "NASDAQ"
      });
    });
  } catch (error) {
    // Yahoo search may rate-limit Apps Script. The built-in NASDAQ base keeps mobile search usable.
  }
  const symbol = normalizeNasdaqSymbol_(raw);
  if (!items.length && symbol) items.push({ ticker: symbol, name: symbol, market: "NASDAQ" });
  return items.slice(0, maxItems);
}

function searchNasdaqBaseStocks_(query, limit) {
  const raw = String(query || "").trim();
  const normalized = normalizeText_(raw);
  const symbol = normalizeNasdaqSymbol_(raw);
  const rows = getNasdaqBaseStocks_().map((stock) => {
    const ticker = normalizeNasdaqSymbol_(stock.ticker);
    const nameText = normalizeText_(stock.name);
    let score = 0;
    if (ticker === symbol || normalizeText_(ticker) === normalized) score = 100;
    else if (ticker.indexOf(symbol) === 0 && symbol) score = 90;
    else if (nameText === normalized) score = 85;
    else if (nameText.indexOf(normalized) >= 0 && normalized) score = 70;
    return score ? { ticker, name: stock.name, market: "NASDAQ", _score: score } : null;
  }).filter(Boolean);
  return rows.sort((a, b) => b._score - a._score || String(a.ticker).localeCompare(String(b.ticker))).slice(0, Math.max(1, Number(limit || 20))).map((row) => {
    delete row._score;
    return row;
  });
}

function findNasdaqBaseBySymbol_(symbol) {
  symbol = normalizeNasdaqSymbol_(symbol);
  if (!symbol) return null;
  const staticMatch = NASDAQ_BASE_STOCKS.find((stock) => normalizeNasdaqSymbol_(stock.ticker) === symbol);
  if (staticMatch) return { ticker: normalizeNasdaqSymbol_(staticMatch.ticker), name: staticMatch.name };
  const found = getNasdaqBaseStocks_().find((stock) => normalizeNasdaqSymbol_(stock.ticker) === symbol);
  return found ? { ticker: normalizeNasdaqSymbol_(found.ticker), name: found.name } : null;
}

function getNasdaqBaseStocks_() {
  try {
    const text = fetchText_("https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt", "UTF-8");
    const parsed = parseNasdaqListedText_(text);
    if (parsed.length) return parsed;
  } catch (error) {
    // Keep the app usable when Nasdaq Trader is temporarily unavailable.
  }
  return NASDAQ_BASE_STOCKS.map((stock) => ({
    ticker: normalizeNasdaqSymbol_(stock.ticker),
    name: stock.name,
    market: "NASDAQ"
  }));
}

function parseNasdaqListedText_(text) {
  const rows = [];
  String(text || "").split(/\r?\n/).forEach((line) => {
    const parts = String(line || "").trim().split("|");
    if (parts.length < 8 || parts[0] === "Symbol" || parts[0].indexOf("File Creation Time") === 0) return;
    const ticker = normalizeNasdaqSymbol_(parts[0]);
    const name = cleanNasdaqSecurityName_(parts[1]);
    const testIssue = String(parts[3] || "").toUpperCase();
    const etf = String(parts[6] || "").toUpperCase();
    const nextShares = String(parts[7] || "").toUpperCase();
    if (!ticker || !name) return;
    if (testIssue === "Y" || etf === "Y" || nextShares === "Y") return;
    if (!isCompanyLikeNasdaqSecurity_(ticker, name)) return;
    rows.push({ ticker, name, market: "NASDAQ" });
  });
  return rows;
}

function cleanNasdaqSecurityName_(name) {
  return String(name || "")
    .replace(/\s+-\s+Common Stock$/i, "")
    .replace(/\s+-\s+Class [A-Z] Common Stock$/i, "")
    .replace(/\s+-\s+Ordinary Shares?$/i, "")
    .replace(/\s+-\s+American Depositary Shares?.*$/i, " - ADR")
    .trim();
}

function isCompanyLikeNasdaqSecurity_(ticker, name) {
  const upperName = String(name || "").toUpperCase();
  if (ticker.indexOf("^") >= 0 || ticker.indexOf("$") >= 0) return false;
  if (/W$/.test(ticker) && upperName.indexOf("WARRANT") >= 0) return false;
  if (/U$/.test(ticker) && upperName.indexOf("UNIT") >= 0) return false;
  if (/R$/.test(ticker) && upperName.indexOf("RIGHT") >= 0) return false;
  return !/(WARRANT|RIGHT|UNIT|PREFERRED|DEPOSITARY SHARES|NOTE DUE|BOND|ETF|ETN|FUND|TRUST|INDEX)/.test(upperName);
}

function fetchNasdaqQuote_(query) {
  const ticker = normalizeNasdaqSymbol_(query);
  try {
    const result = fetchNasdaqChart_(ticker, "5d", "1d");
    const meta = result.meta || {};
    const quote = (((result.indicators || {}).quote || [])[0]) || {};
    const closes = (quote.close || []).filter((value) => value != null).map(Number);
    const volumes = (quote.volume || []).filter((value) => value != null).map(Number);
    const currentPrice = nullableNumber_(meta.regularMarketPrice) || last_(closes) || 0;
    const previousClose = nullableNumber_(meta.previousClose);
    return {
      ticker,
      name: meta.shortName || meta.longName || (findNasdaqBaseBySymbol_(ticker) || {}).name || ticker,
      market: "NASDAQ",
      currentPrice,
      previousClose,
      change: previousClose ? currentPrice - previousClose : null,
      changeRate: previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : null,
      volume: nullableNumber_(meta.regularMarketVolume) || last_(volumes) || null
    };
  } catch (error) {
    const prices = fetchStooqDailyPrices_(ticker, 5);
    const current = last_(prices);
    const previous = prices.length > 1 ? prices[prices.length - 2] : null;
    const previousClose = previous ? previous.close : null;
    return {
      ticker,
      name: (findNasdaqBaseBySymbol_(ticker) || {}).name || ticker,
      market: "NASDAQ",
      currentPrice: current ? current.close : 0,
      previousClose,
      change: previousClose && current ? current.close - previousClose : null,
      changeRate: previousClose && current ? ((current.close - previousClose) / previousClose) * 100 : null,
      volume: current ? current.volume : null
    };
  }
}

function fetchNasdaqDailyPrices_(query, count) {
  const ticker = normalizeNasdaqSymbol_(query);
  try {
    const result = fetchNasdaqChart_(ticker, "1y", "1d");
    const timestamps = result.timestamp || [];
    const quote = (((result.indicators || {}).quote || [])[0]) || {};
    const rows = [];
    timestamps.forEach((stamp, index) => {
      const close = nullableNumber_((quote.close || [])[index]);
      if (close == null) return;
      rows.push({
        date: Utilities.formatDate(new Date(Number(stamp) * 1000), "GMT", "yyyyMMdd"),
        open: nullableNumber_((quote.open || [])[index]) || close,
        high: nullableNumber_((quote.high || [])[index]) || close,
        low: nullableNumber_((quote.low || [])[index]) || close,
        close,
        volume: nullableNumber_((quote.volume || [])[index]) || 0
      });
    });
    if (!rows.length) throw new Error("나스닥 일봉 데이터를 가져오지 못했습니다.");
    return rows.slice(-Number(count || 260));
  } catch (error) {
    return fetchStooqDailyPrices_(ticker, count);
  }
}

function fetchNasdaqChart_(ticker, range, interval) {
  ticker = normalizeNasdaqSymbol_(ticker);
  if (!ticker) throw new Error("나스닥 심볼을 입력하세요.");
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/" + encodeURIComponent(ticker) + "?range=" + encodeURIComponent(range) + "&interval=" + encodeURIComponent(interval);
  const payload = JSON.parse(fetchText_(url, "UTF-8"));
  const chart = payload.chart || {};
  if (chart.error) throw new Error(chart.error.description || "나스닥 시세 요청 실패");
  const result = (chart.result || [])[0];
  if (!result) throw new Error("나스닥 시세 데이터를 가져오지 못했습니다.");
  return result;
}

function fetchNasdaqFundamental_(ticker, quote) {
  ticker = normalizeNasdaqSymbol_(ticker);
  const fallback = {
    ticker,
    eps: null,
    bps: null,
    per: null,
    pbr: null,
    dividend_yield: null,
    revenue: null,
    operatingIncome: null,
    revenueGrowth: null,
    operatingIncomeGrowth: null,
    source: "Yahoo Finance chart",
    note: "나스닥 모바일 분석은 현재 가격, 거래량, 이동평균, RSI 중심으로 계산합니다."
  };
  let yahooFundamental = null;
  try {
    const summary = fetchYahooQuoteSummary_(ticker, "defaultKeyStatistics,financialData,summaryDetail,price");
    const stats = summary.defaultKeyStatistics || {};
    const financial = summary.financialData || {};
    const detail = summary.summaryDetail || {};
    const eps = yahooNumber_(stats.trailingEps) || yahooNumber_(stats.forwardEps);
    const bps = yahooNumber_(stats.bookValue);
    const per = yahooNumber_(detail.trailingPE) || yahooNumber_(detail.forwardPE) || yahooNumber_(stats.trailingPE) || yahooNumber_(stats.forwardPE);
    const pbr = yahooNumber_(stats.priceToBook);
    const dividendYield = yahooNumber_(detail.dividendYield);
    yahooFundamental = {
      ticker,
      eps,
      bps,
      per,
      pbr,
      dividend_yield: dividendYield == null ? null : dividendYield * 100,
      revenue: yahooNumber_(financial.totalRevenue),
      operatingIncome: null,
      revenueGrowth: yahooNumber_(financial.revenueGrowth),
      operatingIncomeGrowth: yahooNumber_(financial.earningsGrowth),
      source: "Yahoo Finance quoteSummary",
      note: pbr == null ? "PBR은 Yahoo에서 제공되지 않는 종목이 있어 비어 있을 수 있습니다." : ""
    };
  } catch (error) {
    yahooFundamental = fallback;
  }
  let naverFundamental = null;
  try {
    naverFundamental = fetchNaverWorldFundamental_(ticker);
  } catch (error) {
    naverFundamental = null;
  }
  let nasdaqSummary = null;
  try {
    nasdaqSummary = fetchNasdaqSummaryFundamental_(ticker);
  } catch (error) {
    nasdaqSummary = null;
  }
  let nasdaqFinancials = null;
  try {
    nasdaqFinancials = fetchNasdaqFinancialFundamental_(ticker);
  } catch (error) {
    nasdaqFinancials = null;
  }
  return mergeNasdaqFundamental_(fallback, yahooFundamental, naverFundamental, nasdaqSummary, nasdaqFinancials, quote);
}

function fetchYahooQuoteSummary_(ticker, modules) {
  const url = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/" + encodeURIComponent(normalizeNasdaqSymbol_(ticker)) + "?modules=" + encodeURIComponent(modules);
  const payload = JSON.parse(fetchText_(url, "UTF-8"));
  const result = (((payload || {}).quoteSummary || {}).result || [])[0];
  if (!result) throw new Error("Yahoo 재무지표를 가져오지 못했습니다.");
  return result;
}

function yahooNumber_(value) {
  if (value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "raw")) return nullableNumber_(value.raw);
  return nullableNumber_(value);
}

function fetchNaverWorldFundamental_(ticker) {
  ticker = normalizeNasdaqSymbol_(ticker);
  const url = "https://m.stock.naver.com/worldstock/stock/" + encodeURIComponent(ticker + ".O") + "/total";
  const html = fetchText_(url, "UTF-8");
  const text = stripTags_(html).replace(/\s+/g, " ");
  return {
    ticker,
    eps: firstNumber_(naverWorldHtmlMetric_(html, "EPS"), naverWorldJsonMetric_(html, "EPS"), naverWorldMetric_(text, "EPS")),
    bps: firstNumber_(naverWorldHtmlMetric_(html, "BPS"), naverWorldJsonMetric_(html, "BPS"), naverWorldMetric_(text, "BPS")),
    per: firstNumber_(naverWorldHtmlMetric_(html, "PER"), naverWorldJsonMetric_(html, "PER"), naverWorldMetric_(text, "PER")),
    pbr: firstNumber_(naverWorldHtmlMetric_(html, "PBR"), naverWorldJsonMetric_(html, "PBR"), naverWorldMetric_(text, "PBR")),
    dividend_yield: firstNumber_(naverWorldJsonMetric_(html, "배당수익률"), naverWorldMetric_(text, "배당수익률")),
    source: "Naver Pay Securities"
  };
}

function fetchNasdaqSummaryFundamental_(ticker) {
  ticker = normalizeNasdaqSymbol_(ticker);
  const url = "https://api.nasdaq.com/api/quote/" + encodeURIComponent(ticker) + "/summary?assetclass=stocks";
  const payload = JSON.parse(fetchText_(url, "UTF-8"));
  const summary = (((payload || {}).data || {}).summaryData || {});
  return {
    ticker,
    marketCap: nasdaqSummaryNumber_(summary.MarketCap),
    dividend_yield: nasdaqSummaryNumber_(summary.Yield),
    volume: nasdaqSummaryNumber_(summary.ShareVolume),
    source: "Nasdaq official summary"
  };
}

function fetchNasdaqFinancialFundamental_(ticker) {
  ticker = normalizeNasdaqSymbol_(ticker);
  const url = "https://api.nasdaq.com/api/company/" + encodeURIComponent(ticker) + "/financials?frequency=1";
  const payload = JSON.parse(fetchText_(url, "UTF-8"));
  const data = (payload || {}).data || {};
  const incomeRows = (((data.incomeStatementTable || {}).rows) || []);
  const balanceRows = (((data.balanceSheetTable || {}).rows) || []);
  const revenueValues = nasdaqFinancialRowValues_(incomeRows, "Total Revenue");
  const operatingValues = nasdaqFinancialRowValues_(incomeRows, "Operating Income");
  const netIncomeValues = nasdaqFinancialRowValues_(incomeRows, "Net Income");
  const equityValues = nasdaqFinancialRowValues_(balanceRows, "Total Equity");
  return {
    ticker,
    revenue: revenueValues[0] || null,
    operatingIncome: operatingValues[0] || null,
    netIncome: netIncomeValues[0] || null,
    totalEquity: equityValues[0] || null,
    revenueGrowth: growthFromPair_(revenueValues[0], revenueValues[1]),
    operatingIncomeGrowth: growthFromPair_(operatingValues[0], operatingValues[1]),
    source: "Nasdaq official financials"
  };
}

function mergeNasdaqFundamental_(fallback, yahooFundamental, naverFundamental, nasdaqSummary, nasdaqFinancials, quote) {
  const merged = Object.assign({}, fallback, yahooFundamental || {});
  [naverFundamental, nasdaqSummary, nasdaqFinancials].forEach((source) => {
    if (!source) return;
    ["eps", "bps", "per", "pbr", "dividend_yield", "revenue", "operatingIncome", "revenueGrowth", "operatingIncomeGrowth"].forEach((key) => {
      merged[key] = firstNumber_(merged[key], source[key]);
    });
    merged.marketCap = firstNumber_(merged.marketCap, source.marketCap);
    merged.netIncome = firstNumber_(merged.netIncome, source.netIncome);
    merged.totalEquity = firstNumber_(merged.totalEquity, source.totalEquity);
  });
  const currentPrice = nullableNumber_(quote && quote.currentPrice);
  const marketCap = nullableNumber_(merged.marketCap);
  const totalEquity = nullableNumber_(merged.totalEquity);
  const netIncome = nullableNumber_(merged.netIncome);
  const shares = marketCap && currentPrice ? marketCap / currentPrice : null;
  if (merged.bps == null && totalEquity && shares) merged.bps = totalEquity / shares;
  if (merged.eps == null && netIncome && shares) merged.eps = netIncome / shares;
  if (merged.per == null && merged.eps && currentPrice) merged.per = currentPrice / merged.eps;
  if (merged.pbr == null && merged.bps && currentPrice) merged.pbr = currentPrice / merged.bps;
  if (merged.pbr == null && marketCap && totalEquity) merged.pbr = marketCap / totalEquity;
  const sources = [];
  if (yahooFundamental && yahooFundamental.source && yahooFundamental.source !== fallback.source) sources.push(yahooFundamental.source);
  if (naverFundamental && naverFundamental.source) sources.push(naverFundamental.source);
  if (nasdaqSummary && nasdaqSummary.source) sources.push(nasdaqSummary.source);
  if (nasdaqFinancials && nasdaqFinancials.source) sources.push(nasdaqFinancials.source);
  merged.source = sources.length ? sources.join(" + ") : fallback.source;
  if (sources.length > 1) {
    merged.note = "Yahoo, 네이버 해외증권, Nasdaq 공식 재무제표를 교차 사용하고, 빈 PER/PBR/EPS/BPS는 시총·자본·순이익으로 역산했습니다.";
  }
  return merged;
}

function naverWorldHtmlMetric_(html, label) {
  const escaped = escapeRegex_(label);
  const regex = new RegExp("<strong[^>]*>\\s*" + escaped + "[\\s\\S]*?</strong>\\s*<span[^>]*>\\s*([^<]+)", "i");
  const match = regex.exec(html || "");
  return match ? toNumber_(match[1]) : null;
}

function naverWorldJsonMetric_(html, label) {
  const escaped = escapeRegex_(label);
  const regex = new RegExp("\"key\"\\s*:\\s*\"" + escaped + "\"[\\s\\S]{0,240}?\"value\"\\s*:\\s*\"([^\"]+)\"", "i");
  const match = regex.exec(html || "");
  return match ? toNumber_(match[1]) : null;
}

function naverWorldMetric_(text, label) {
  const escaped = escapeRegex_(label);
  const patterns = [
    new RegExp(escaped + "\\s*\\d{4}\\.\\d{2}\\.\\s*([-+]?\\d[\\d,]*(?:\\.\\d+)?)", "i"),
    new RegExp(escaped + "\\s+([-+]?\\d[\\d,]*(?:\\.\\d+)?)", "i")
  ];
  for (let index = 0; index < patterns.length; index += 1) {
    const match = patterns[index].exec(text || "");
    if (match) return toNumber_(match[1]);
  }
  return null;
}

function nasdaqSummaryNumber_(item) {
  if (!item || typeof item !== "object") return null;
  return toNumber_(item.value);
}

function nasdaqFinancialRowValues_(rows, label) {
  const row = (rows || []).find((item) => String(item.value1 || "").toLowerCase() === String(label || "").toLowerCase());
  if (!row) return [];
  return ["value2", "value3", "value4", "value5"]
    .map((key) => nasdaqFinancialNumber_(row[key]))
    .filter((value) => value != null);
}

function nasdaqFinancialNumber_(value) {
  const number = toNumber_(value);
  return number == null ? null : number * 1000;
}

function growthFromPair_(current, previous) {
  current = nullableNumber_(current);
  previous = nullableNumber_(previous);
  if (current == null || previous == null || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

function firstNumber_() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = nullableNumber_(arguments[index]);
    if (value != null) return value;
  }
  return null;
}

function escapeRegex_(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fetchStooqDailyPrices_(ticker, count) {
  ticker = normalizeNasdaqSymbol_(ticker);
  const url = "https://stooq.com/q/d/l/?s=" + encodeURIComponent(ticker.toLowerCase() + ".us") + "&i=d";
  const text = fetchText_(url, "UTF-8");
  const rows = text.split(/\r?\n/).slice(1).map((line) => {
    const parts = line.split(",");
    if (parts.length < 6 || !/\d{4}-\d{2}-\d{2}/.test(parts[0])) return null;
    const close = nullableNumber_(parts[4]);
    if (close == null) return null;
    return {
      date: parts[0].replace(/-/g, ""),
      open: nullableNumber_(parts[1]) || close,
      high: nullableNumber_(parts[2]) || close,
      low: nullableNumber_(parts[3]) || close,
      close,
      volume: nullableNumber_(parts[5]) || 0
    };
  }).filter(Boolean);
  if (!rows.length) throw new Error("나스닥 일봉 데이터를 가져오지 못했습니다.");
  return rows.slice(-Number(count || 260));
}

function fetchQuote_(query) {
  const ticker = normalizeTicker_(query);
  const candidates = [
    safeKospiQuote_(function () { return fetchNaverItemSummaryQuote_(ticker); }),
    safeKospiQuote_(function () { return fetchNaverPollingQuote_(ticker); }),
    safeKospiQuote_(function () { return fetchNaverMobileBasicQuote_(ticker); }),
    safeKospiQuote_(function () { return fetchNaverHtmlQuote_(ticker); })
  ].filter(Boolean);
  const selected = chooseKospiQuote_(ticker, candidates);
  return selected || {
    ticker,
    name: "",
    market: "KOSPI",
    currentPrice: 0,
    quoteSource: "unavailable",
    priceFetchedAt: new Date().toISOString()
  };
}

function safeKospiQuote_(factory) {
  try {
    const quote = factory();
    return quote && Number(quote.currentPrice) > 0 ? quote : null;
  } catch (error) {
    return null;
  }
}

function chooseKospiQuote_(ticker, candidates) {
  const valid = candidates.filter((quote) => quote && Number(quote.currentPrice) > 0);
  if (!valid.length) return null;
  const priority = {
    naver_item_summary: 1,
    naver_realtime: 2,
    naver_mobile_basic: 3,
    naver_html: 4
  };
  valid.sort((a, b) => (priority[a.quoteSource] || 99) - (priority[b.quoteSource] || 99));
  const selected = Object.assign({}, valid[0]);
  const named = valid.find((quote) => quote.name);
  selected.ticker = ticker;
  selected.market = "KOSPI";
  selected.name = selected.name || (named && named.name) || "";
  selected.priceFetchedAt = selected.priceFetchedAt || new Date().toISOString();
  return selected;
}

function fetchNaverItemSummaryQuote_(ticker) {
  const url = "https://api.finance.naver.com/service/itemSummary.naver?itemcode=" + encodeURIComponent(ticker);
  const payload = JSON.parse(fetchText_(url, "UTF-8"));
  const currentPrice = firstQuoteNumber_(payload.now, payload.closePrice, payload.currentPrice, payload.nv);
  if (!currentPrice || currentPrice <= 0) throw new Error("itemSummary price unavailable");
  const diff = firstQuoteNumber_(payload.diff, payload.change, payload.cv);
  const rate = firstQuoteNumber_(payload.rate, payload.changeRate, payload.cr);
  return {
    ticker,
    name: payload.name || payload.stockName || "",
    market: "KOSPI",
    currentPrice,
    previousClose: diff == null ? null : currentPrice - diff,
    change: diff,
    changeRate: rate,
    volume: firstQuoteNumber_(payload.quant, payload.volume, payload.accumulatedTradingVolume),
    quoteSource: "naver_item_summary",
    priceFetchedAt: new Date().toISOString()
  };
}

function fetchNaverPollingQuote_(ticker) {
  const url = "https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:" + encodeURIComponent(ticker);
  const text = fetchText_(url, "EUC-KR");
  const payload = JSON.parse(text);
  const areas = (((payload || {}).result || {}).areas || []);
  const datas = areas.length ? areas[0].datas || [] : [];
  if (!datas.length) throw new Error("polling price unavailable");
  const data = datas[0];
  const down = String(data.rf || "") === "4" || String(data.rf || "") === "5";
  const change = firstQuoteNumber_(data.cv, data.change);
  const changeRate = firstQuoteNumber_(data.cr, data.changeRate);
  return {
    ticker,
    market: "KOSPI",
    name: data.nm || "",
    currentPrice: firstQuoteNumber_(data.nv, data.closePrice, data.now),
    previousClose: firstQuoteNumber_(data.pcv, data.sv, data.previousClose),
    change: change == null ? null : change * (down ? -1 : 1),
    changeRate: changeRate == null ? null : changeRate * (down ? -1 : 1),
    volume: firstQuoteNumber_(data.aq, data.accumulatedTradingVolume, data.volume),
    quoteSource: "naver_realtime",
    priceFetchedAt: new Date().toISOString()
  };
}

function fetchNaverMobileBasicQuote_(ticker) {
  const url = "https://m.stock.naver.com/api/stock/" + encodeURIComponent(ticker) + "/basic";
  const payload = JSON.parse(fetchText_(url, "UTF-8"));
  const currentPrice = firstQuoteNumber_(payload.closePrice, payload.now, payload.currentPrice, payload.tradePrice, payload.nv);
  if (!currentPrice || currentPrice <= 0) throw new Error("mobile basic price unavailable");
  const change = firstQuoteNumber_(payload.compareToPreviousClosePrice, payload.change, payload.diff);
  const changeRate = firstQuoteNumber_(payload.fluctuationsRatio, payload.changeRate, payload.rate);
  return {
    ticker,
    name: payload.stockName || payload.name || "",
    market: "KOSPI",
    currentPrice,
    previousClose: change == null ? null : currentPrice - change,
    change,
    changeRate,
    volume: firstQuoteNumber_(payload.accumulatedTradingVolume, payload.volume, payload.quant),
    quoteSource: "naver_mobile_basic",
    priceFetchedAt: new Date().toISOString()
  };
}

function fetchNaverHtmlQuote_(ticker) {
  const text = fetchText_("https://finance.naver.com/item/main.naver?code=" + encodeURIComponent(ticker), "EUC-KR");
  const todayBlock = /<p[^>]*class=["']no_today["'][^>]*>([\s\S]*?)<\/p>/i.exec(text);
  const priceMatch = todayBlock ? /<span[^>]*class=["']blind["'][^>]*>\s*([\d,]+)\s*<\/span>/i.exec(todayBlock[1]) : null;
  const titleMatch = /<title>\s*([^:<]+)/i.exec(text);
  const currentPrice = priceMatch ? toNumber_(priceMatch[1]) : null;
  if (!currentPrice || currentPrice <= 0) throw new Error("html price unavailable");
  return {
    ticker,
    name: titleMatch ? stripTags_(titleMatch[1]) : "",
    market: "KOSPI",
    currentPrice,
    previousClose: null,
    change: null,
    changeRate: null,
    volume: null,
    quoteSource: "naver_html",
    priceFetchedAt: new Date().toISOString()
  };
}

function firstQuoteNumber_() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = arguments[index];
    if (value == null || value === "") continue;
    const number = typeof value === "number" ? value : toNumber_(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function applyQuoteToDailyPrices_(prices, quote, currentPrice, market) {
  const rows = Array.isArray(prices) ? prices.slice() : [];
  if (!rows.length || !currentPrice || currentPrice <= 0) return rows;
  const timezone = marketCode_(market) === "NASDAQ" ? "America/New_York" : "Asia/Seoul";
  const today = Utilities.formatDate(new Date(), timezone, "yyyyMMdd");
  const lastRow = rows[rows.length - 1] || {};
  const quoteVolume = firstQuoteNumber_(quote && quote.volume);
  const volume = quoteVolume == null ? lastRow.volume || 0 : Math.max(quoteVolume, lastRow.volume || 0);
  if (lastRow.date === today) {
    rows[rows.length - 1] = Object.assign({}, lastRow, {
      high: Math.max(lastRow.high || currentPrice, currentPrice),
      low: Math.min(lastRow.low || currentPrice, currentPrice),
      close: currentPrice,
      volume
    });
  } else {
    rows.push({
      date: today,
      open: currentPrice,
      high: currentPrice,
      low: currentPrice,
      close: currentPrice,
      volume
    });
  }
  return rows;
}

function fetchDailyPrices_(ticker, count) {
  ticker = normalizeTicker_(ticker);
  const url = "https://fchart.stock.naver.com/sise.nhn?symbol=" + ticker + "&timeframe=day&count=" + Number(count || 260) + "&requestType=0";
  const text = fetchText_(url);
  const rows = [];
  const regex = /<item data="([^"]+)"/g;
  let match;
  while ((match = regex.exec(text))) {
    const parts = match[1].split("|");
    if (parts.length < 6) continue;
    rows.push({
      date: parts[0],
      open: Number(parts[1]),
      high: Number(parts[2]),
      low: Number(parts[3]),
      close: Number(parts[4]),
      volume: Number(parts[5])
    });
  }
  if (!rows.length) throw new Error("일봉 데이터를 가져오지 못했습니다.");
  return rows;
}

function fetchFundamental_(ticker) {
  ticker = normalizeTicker_(ticker);
  const text = fetchText_("https://finance.naver.com/item/main.naver?code=" + ticker, "UTF-8");
  return {
    eps: latestMetric_(text, "EPS"),
    bps: latestMetric_(text, "BPS"),
    per: latestMetric_(text, "PER"),
    pbr: latestMetric_(text, "PBR"),
    dividend_yield: dividendYield_(text),
    revenue: latestMetricWonFromEok_(text, "\uB9E4\uCD9C\uC561"),
    operatingIncome: latestMetricWonFromEok_(text, "\uC601\uC5C5\uC774\uC775"),
    revenueGrowth: metricGrowth_(text, "\uB9E4\uCD9C\uC561"),
    operatingIncomeGrowth: metricGrowth_(text, "\uC601\uC5C5\uC774\uC775")
  };
}

function latestMetric_(text, metric) {
  const row = new RegExp("<th[^>]*>\\s*(?:<strong>)?\\s*" + metric + "[\\s\\S]*?</th>([\\s\\S]*?)</tr>", "i").exec(text);
  if (!row) return null;
  const values = [];
  const regex = /<td[^>]*>\s*(?:<em>)?\s*([-+]?\d[\d,]*(?:\.\d+)?)/g;
  let match;
  while ((match = regex.exec(row[1]))) {
    const value = toNumber_(match[1]);
    if (value && value > 0) values.push(value);
  }
  return values.length ? values[values.length - 1] : null;
}

function metricValues_(text, metric, positiveOnly) {
  const row = new RegExp("<th[^>]*>\\s*(?:<strong>)?\\s*" + metric + "[\\s\\S]*?</th>([\\s\\S]*?)</tr>", "i").exec(text);
  if (!row) return [];
  const values = [];
  const regex = /<td[^>]*>\s*(?:<em>)?\s*([-+]?\d[\d,]*(?:\.\d+)?)/g;
  let match;
  while ((match = regex.exec(row[1]))) {
    const value = toNumber_(match[1]);
    if (value == null) continue;
    if (positiveOnly && value <= 0) continue;
    values.push(value);
  }
  return values;
}

function latestMetricWonFromEok_(text, metric) {
  const values = metricValues_(text, metric, true);
  return values.length ? values[values.length - 1] * 100000000 : null;
}

function metricGrowth_(text, metric) {
  const values = metricValues_(text, metric, false).filter((value) => value !== 0);
  if (values.length < 2) return null;
  const previous = values[values.length - 2];
  const current = values[values.length - 1];
  if (!previous) return null;
  return (current - previous) / Math.abs(previous);
}

function dividendYield_(text) {
  const match = new RegExp("\\uBC30\\uB2F9\\uC218\\uC775\\uB960[\\s\\S]*?([-+]?\\d[\\d,]*(?:\\.\\d+)?)\\s*%").exec(text);
  return match ? toNumber_(match[1]) : null;
}

function mergeCurrentFundamentals_(ticker, currentPrice, fundamental) {
  if (!fundamental) return null;
  const merged = {
    ticker,
    eps: fundamental.eps,
    bps: fundamental.bps,
    per: fundamental.per,
    pbr: fundamental.pbr,
    dividend_yield: fundamental.dividend_yield,
    revenue: fundamental.revenue,
    operatingIncome: fundamental.operatingIncome,
    revenueGrowth: fundamental.revenueGrowth,
    operatingIncomeGrowth: fundamental.operatingIncomeGrowth,
    source: "Naver Finance"
  };
  if (merged.bps && merged.bps > 0 && currentPrice > 0) {
    merged.pbr = currentPrice / merged.bps;
  }
  return merged;
}

function calculateIndicators_(prices) {
  const closes = prices.map((row) => row.close);
  const volumes = prices.map((row) => row.volume);
  const ma20 = sma_(closes, 20);
  const ma60 = sma_(closes, 60);
  const ma120 = sma_(closes, 120);
  const ma240 = sma_(closes, 240);
  const rsiSeries = rsiSeries_(closes, 14);
  return {
    ma20,
    ma60,
    ma120,
    ma240,
    vwap: calculateVwap_(prices),
    rsi14: last_(rsiSeries),
    atr14: atr_(prices, 14),
    volumeZscore: zscoreLast_(volumes, 20),
    bullish: bullishDivergence_(closes, rsiSeries, 2, 60)
  };
}

function applyLiveVolumeIndicators_(indicators, prices, quote) {
  const recentVolumes = prices.slice(-20).map((row) => row.volume || 0);
  const averageVolume = avg_(recentVolumes);
  const liveVolume = Number((quote && quote.volume) || last_(prices).volume || 0);
  if (!liveVolume || !averageVolume) return;
  const std = std_(recentVolumes);
  const liveZscore = std > 0 ? (liveVolume - averageVolume) / std : null;
  indicators.liveVolume = liveVolume;
  indicators.liveVolumeRatio = liveVolume / averageVolume;
  indicators.liveVolumeZscore = liveZscore;
  if (liveZscore != null && (indicators.volumeZscore == null || liveZscore > indicators.volumeZscore)) {
    indicators.volumeZscore = liveZscore;
  }
}

function calculateFairValue_(currentPrice, indicators, fundamental) {
  const values = {};
  let technicalValue = technicalFairValue_(indicators) || currentPrice;
  if (fundamental && Object.keys(fundamental).some((key) => fundamental[key] != null)) {
    technicalValue = Math.max(technicalValue, currentPrice * 0.9);
  }
  if (technicalValue > 0) values.technical_value = technicalValue;

  if (fundamental && fundamental.bps && fundamental.bps > 0) {
    values.dcf_value = fundamental.bps;
    const targetPbr = fundamental.pbr && fundamental.pbr > 0
      ? Math.max(0.75, Math.min(1.2, fundamental.pbr * 1.35))
      : 0.85;
    values.pbr_roe_value = pbrRoeValue_(fundamental.bps, 0.10, targetPbr);
  }

  const usablePer = !fundamental || fundamental.per == null || (fundamental.per > 0 && fundamental.per <= 30);
  if (fundamental && fundamental.eps && fundamental.eps > 0 && usablePer) {
    let targetPer = 10.0;
    if (fundamental.per && fundamental.per > 0) {
      targetPer = Math.max(8.0, Math.min(14.0, fundamental.per * 1.35));
    }
    values.per_value = fundamental.eps * targetPer;
    values.peg_value = fundamental.eps * Math.max(7.0, targetPer * 0.85);
  }

  return weightedFairValue_(values) || currentPrice;
}

function calculateFinalScore_(currentPrice, fairValue, indicators, fundamental, prices) {
  const valuationGap = currentPrice > 0 ? fairValue / currentPrice - 1 : 0;
  let valueScore = clamp_(60 + valuationGap * 140);
  let qualityScore = 60;
  let growthScore = 60;
  let safetyScore = 60;
  if (fundamental.per && fundamental.per > 0 && fundamental.per <= 10) {
    valueScore += 8;
    qualityScore += 5;
  }
  if (fundamental.pbr && fundamental.pbr > 0 && fundamental.pbr <= 1) {
    valueScore += 8;
    qualityScore += 8;
    safetyScore += 7;
  }
  if (fundamental.eps && fundamental.eps > 0) {
    qualityScore += 10;
    safetyScore += 8;
  }
  if (fundamental.bps && fundamental.bps > 0) qualityScore += 5;
  if (fundamental.dividend_yield && fundamental.dividend_yield > 2) safetyScore += 5;
  if (fundamental.operatingIncome && fundamental.operatingIncome > 0) {
    qualityScore += 5;
    safetyScore += 3;
  }
  if (fundamental.revenueGrowth != null) {
    if (fundamental.revenueGrowth > 0.15) growthScore += 16;
    else if (fundamental.revenueGrowth > 0.05) growthScore += 8;
    else if (fundamental.revenueGrowth < -0.10) growthScore -= 8;
  }
  if (fundamental.operatingIncomeGrowth != null) {
    if (fundamental.operatingIncomeGrowth > 0.15) growthScore += 14;
    else if (fundamental.operatingIncomeGrowth > 0.05) growthScore += 8;
    else if (fundamental.operatingIncomeGrowth < -0.10) growthScore -= 10;
  }
  const momentumScore = technicalScore_(indicators);
  const averageVolume = avg_(prices.slice(-20).map((row) => row.volume));
  const tradedValue = averageVolume * currentPrice;
  const liquidityScore = tradedValue >= 20000000000 ? 90 : tradedValue >= 5000000000 ? 80 : tradedValue >= 1000000000 ? 70 : tradedValue >= 100000000 ? 60 : 40;
  const finalScore = clamp_(valueScore) * 0.2 + clamp_(qualityScore) * 0.25 + clamp_(growthScore) * 0.15 + momentumScore * 0.2 + clamp_(safetyScore) * 0.1 + liquidityScore * 0.1;
  return Math.round(finalScore * 10000) / 10000;
}

function technicalScore_(indicators) {
  let score = 50;
  if (indicators.ma20 && indicators.ma60 && indicators.ma20 > indicators.ma60) score += 15;
  if (indicators.rsi14 && indicators.rsi14 > 40) score += 10;
  if (indicators.volumeZscore && indicators.volumeZscore > 1.5) score += 10;
  if (indicators.bullish) score += 15;
  return clamp_(score);
}

function technicalFairValue_(indicators) {
  const values = [indicators.ma20, indicators.ma60, indicators.ma120, indicators.vwap].filter((value) => value && value > 0);
  return values.length ? avg_(values) : null;
}

function weightedFairValue_(values) {
  const available = {};
  Object.keys(FAIR_VALUE_WEIGHTS).forEach((key) => {
    const value = Number(values[key]);
    if (Number.isFinite(value) && value > 0) available[key] = value;
  });
  const keys = Object.keys(available);
  if (!keys.length) return null;
  const totalWeight = keys.reduce((sum, key) => sum + FAIR_VALUE_WEIGHTS[key], 0);
  const composite = keys.reduce((sum, key) => {
    return sum + available[key] * (FAIR_VALUE_WEIGHTS[key] / totalWeight);
  }, 0);
  return Math.round(composite * 10000) / 10000;
}

function pbrRoeValue_(bps, roe, sectorPbr) {
  const qualityAdjustment = roe > 0 ? Math.max(0.5, Math.min(1.5, roe / 0.10)) : 0.5;
  return Math.max(0, bps * sectorPbr * qualityAdjustment);
}

function calculateStopLoss_(entryPrice, atr14) {
  if (entryPrice <= 0) return null;
  if (!atr14 || atr14 <= 0) return Math.round(entryPrice * 0.92 * 10000) / 10000;
  return Math.round(Math.min(entryPrice - 2 * atr14, entryPrice * 0.92) * 10000) / 10000;
}

function generateBuySignal_(ticker, currentPrice, finalScore, indicators, fairValue, stopLoss) {
  const reasons = [];
  const blockedReasons = [];
  if (fairValue && currentPrice <= fairValue) reasons.push("price_within_or_below_buy_zone");
  const nearMa60 = indicators.ma60 && indicators.ma60 > 0 && Math.abs(currentPrice - indicators.ma60) / indicators.ma60 <= 0.02;
  if ((indicators.ma20 && currentPrice > indicators.ma20) || nearMa60) reasons.push("price_above_ma20_or_rebound_from_ma60");
  if (indicators.rsi14 != null && indicators.rsi14 > 40) reasons.push("rsi14_above_40");
  if (indicators.volumeZscore != null && indicators.volumeZscore > 1.5) reasons.push("volume_zscore_above_1_5");
  if (indicators.bullish) reasons.push("bullish_divergence_detected");
  if (finalScore < 70) blockedReasons.push("final_score_below_70");
  if (stopLoss == null || stopLoss >= currentPrice) blockedReasons.push("stop_loss_unavailable");
  const conditionsMet = reasons.length;
  const isValid = conditionsMet >= 3 && !blockedReasons.length;
  const signalStrength = conditionsMet >= 5 && finalScore >= 80 ? "strong" : conditionsMet >= 3 ? "normal" : "weak";
  return {
    ticker,
    signal_type: isValid ? "Buy" : "No Buy",
    is_valid: isValid,
    signal_strength: signalStrength,
    final_score: finalScore,
    entry_price: isValid ? currentPrice : null,
    stop_loss_price: stopLoss,
    take_profit_price: isValid ? Math.round(currentPrice * 1.18 * 10000) / 10000 : null,
    trailing_stop_price: indicators.atr14 && indicators.atr14 > 0 ? Math.round((currentPrice - 3 * indicators.atr14) * 10000) / 10000 : Math.round(currentPrice * 0.92 * 10000) / 10000,
    conditions_met: conditionsMet,
    reasons,
    blocked_reasons: blockedReasons
  };
}

function signalTone_(signalDetail, finalScore, upside) {
  if (signalDetail && signalDetail.is_valid) return "green";
  const hardBlocks = (signalDetail && signalDetail.blocked_reasons || []).filter((reason) => reason !== "final_score_below_70");
  if (hardBlocks.length || finalScore < 55 || upside < -0.15) return "red";
  return "yellow";
}

function recommendationLabel_(signalDetail, finalScore) {
  if (signalDetail && signalDetail.is_valid) {
    if (signalDetail.signal_strength === "strong") return "\uAC15\uB825 \uB9E4\uC218";
    return "\uB9E4\uC218 \uAC80\uD1A0";
  }
  const hardBlocks = (signalDetail && signalDetail.blocked_reasons || []).filter((reason) => reason !== "final_score_below_70");
  if (hardBlocks.length) return "\uB9E4\uC218 \uCC28\uB2E8";
  if (finalScore >= 70) return "\uAD00\uC2EC \uD6C4\uBCF4";
  if (finalScore >= 60) return "\uAD00\uCC30";
  return "\uC81C\uC678";
}

function buildBuyPlan_(currentPrice, fairValue, indicators, seedMoney) {
  const base = Math.min(fairValue, indicators.ma20 && indicators.ma20 > 0 ? indicators.ma20 : fairValue);
  const second = Math.min(fairValue * 0.90, indicators.ma60 && indicators.ma60 > 0 ? indicators.ma60 : fairValue * 0.90);
  const third = Math.min(fairValue * 0.80, indicators.ma120 && indicators.ma120 > 0 ? indicators.ma120 : fairValue * 0.80);
  return [
    { label: "1차", price: Math.round(base), ratio: 40, amount: Math.round(seedMoney * 0.4) },
    { label: "2차", price: Math.round(second), ratio: 30, amount: Math.round(seedMoney * 0.3) },
    { label: "3차", price: Math.round(third), ratio: 30, amount: Math.round(seedMoney * 0.3) }
  ];
}

function buildReasons_(finalScore, upside, indicators, fundamental) {
  const reasons = [];
  reasons.push("AISIS 모바일 점수 " + finalScore.toFixed(1) + "점");
  reasons.push("현재가 대비 적정가 괴리율 " + (upside * 100).toFixed(1) + "%");
  if (fundamental.per) reasons.push("PER " + fundamental.per);
  if (fundamental.pbr) reasons.push("PBR " + fundamental.pbr);
  if (indicators.rsi14) reasons.push("RSI " + indicators.rsi14.toFixed(1));
  return reasons;
}

function screenMarket_(market, pages, limit, seedMoney, priorityTickersText, forceTierId) {
  market = marketCode_(market);
  const maxPages = Math.min(Math.max(Number(pages || 80), 1), 80);
  const maxItems = Math.min(Math.max(Number(limit || 200), 20), 300);
  const cache = normalizeScreeningCache_(loadScreeningCache_(market));
  cache.market = market;
  const now = new Date();
  const priorityTickers = parsePriorityTickers_(priorityTickersText, market);
  forceTierId = normalizeForceTierId_(forceTierId);
  if (forceTierId) {
    const forcedResult = runForcedTier_(forceTierId, cache, maxPages, seedMoney, market);
    const priorityResult = mergePriorityAnalyses_(cache, priorityTickers, seedMoney, market);
    const refreshedTierId = forcedResult.ran ? forceTierId : "";
    const message = forcedResult.ran
      ? (forcedResult.message || marketTierLabel_(tierById_(forceTierId), market) + "을(를) 강제 갱신했습니다.") + (priorityResult.count ? " 관심/보유 " + priorityResult.count + "개도 반영했습니다." : "")
      : forcedResult.reason || "강제 갱신하지 못했습니다.";
    if (forcedResult.ran || priorityResult.count) {
      cache.updatedAt = now.toISOString();
      saveScreeningCache_(cache, market);
    }
    return buildScreeningResponse_(cache, maxItems, now, refreshedTierId, message, market);
  }
  if (!tierRows_(cache, "full_nightly").length) {
    const result = runScreeningTier_(SCREENING_TIERS[0], cache, maxPages, seedMoney, { bootstrap: true, market });
    if (result.ran) mergePriorityAnalyses_(cache, priorityTickers, seedMoney, market);
    const message = result.ran
      ? (result.message || marketLabel_(market) + " 초기 후보 목록을 만들었습니다. 야간 시간에 전체 분석으로 다시 갱신됩니다.")
      : result.reason || marketLabel_(market) + " 초기 후보 목록을 만들지 못했습니다.";
    if (result.ran) {
      cache.updatedAt = now.toISOString();
      saveScreeningCache_(cache, market);
    }
    return buildScreeningResponse_(cache, maxItems, now, result.ran ? "full_nightly" : "", message, market);
  }
  const priorityResult = mergePriorityAnalyses_(cache, priorityTickers, seedMoney, market);
  const dueTier = firstDueTier_(cache, now);
  let refreshedTierId = "";
  let runMessage = priorityResult.count
    ? "이미 분석/관심/보유 " + marketLabel_(market) + " 종목 " + priorityResult.count + "개를 후보 점수에 반영했습니다."
    : "실행 주기가 아직 아닙니다. 캐시된 " + marketLabel_(market) + " 후보를 표시합니다.";

  if (dueTier) {
    const result = runScreeningTier_(dueTier, cache, maxPages, seedMoney, { market });
    if (result.ran) {
      refreshedTierId = dueTier.id;
      runMessage = result.message || marketTierLabel_(dueTier, market) + "을(를) 갱신했습니다.";
      cache.updatedAt = now.toISOString();
      saveScreeningCache_(cache, market);
    } else {
      runMessage = result.reason || "선행 분석 결과가 없어 실행하지 않았습니다.";
    }
  }
  if (priorityResult.count && !dueTier) {
    cache.updatedAt = now.toISOString();
    saveScreeningCache_(cache, market);
  }

  return buildScreeningResponse_(cache, maxItems, now, refreshedTierId, runMessage, market);
}

function normalizeForceTierId_(tierId) {
  const value = String(tierId || "").trim();
  return tierById_(value) ? value : "";
}

function tierById_(tierId) {
  return SCREENING_TIERS.find((tier) => tier.id === tierId) || null;
}

function runForcedTier_(tierId, cache, pages, seedMoney, market) {
  const tier = tierById_(tierId);
  if (!tier) return { ran: false, reason: "알 수 없는 티어입니다." };
  if (tier.sourceTierId && !tierRows_(cache, tier.sourceTierId).length) {
    const prerequisite = runForcedTier_(tier.sourceTierId, cache, pages, seedMoney, market);
    if (!prerequisite.ran) return prerequisite;
  }
  return runScreeningTier_(tier, cache, pages, seedMoney, { market, force: true });
}

function parsePriorityTickers_(value, market) {
  market = marketCode_(market);
  const seen = {};
  return String(value || "")
    .split(",")
    .map((raw) => {
      try {
        return market === "NASDAQ" ? normalizeNasdaqSymbol_(raw) : normalizeTicker_(raw);
      } catch (error) {
        return "";
      }
    })
    .filter((ticker) => {
      if (!ticker || seen[ticker]) return false;
      seen[ticker] = true;
      return true;
    })
    .slice(0, 40);
}

function mergePriorityAnalyses_(cache, tickers, seedMoney, market) {
  market = marketCode_(market || cache.market);
  if (!tickers || !tickers.length) return { count: 0 };
  const fullTier = cache.tiers.full_nightly || { rows: [], metadata: {} };
  fullTier.rows = Array.isArray(fullTier.rows) ? fullTier.rows : [];
  let count = 0;
  tickers.forEach((ticker) => {
    try {
      const analysis = analyzeStock_(ticker, seedMoney, market);
      const row = analysisToScreenerRow_(analysis, { ticker, name: ticker, market });
      upsertScreenerRow_(fullTier.rows, row);
      count += 1;
    } catch (error) {
      const existing = fullTier.rows.find((row) => row.ticker === ticker);
      if (!existing) {
        fullTier.rows.push({
          ticker,
          name: ticker,
          market,
          currentPrice: null,
          fairValue: null,
          finalScore: null,
          recommendation: "\uBD84\uC11D \uC2E4\uD328",
          reason: error.message || "\uC6B0\uC120 \uC885\uBAA9 \uBD84\uC11D \uC2E4\uD328"
        });
      }
    }
  });
  fullTier.rows = fullTier.rows.sort(compareScoreRows_);
  fullTier.lastRunAt = fullTier.lastRunAt || new Date().toISOString();
  fullTier.metadata = Object.assign({}, fullTier.metadata || {}, {
    priorityMergedAt: new Date().toISOString(),
    priorityCount: count,
    rowCount: fullTier.rows.length
  });
  cache.tiers.full_nightly = fullTier;
  return { count };
}

function upsertScreenerRow_(rows, row) {
  const index = rows.findIndex((candidate) => candidate.ticker === row.ticker);
  if (index >= 0) {
    rows[index] = Object.assign({}, rows[index], row);
  } else {
    rows.push(row);
  }
}

function runScreeningTier_(tier, cache, pages, seedMoney, options) {
  options = options || {};
  const market = marketCode_(options.market || cache.market);
  if (tier.id === "full_nightly") {
    if (market === "NASDAQ") {
      return runNasdaqFullScreeningTier_(tier, cache, pages, options);
    }
    const stocks = fetchMarketSummaryByMarket_(pages, market);
    const rows = stocks.map(scoreMarketRow_).sort(compareScoreRows_);
    cache.tiers[tier.id] = {
      lastRunAt: new Date().toISOString(),
      rows,
      metadata: {
        selectionBasis: options.bootstrap ? "initial_bootstrap" : "full_universe",
        rowCount: rows.length,
        mode: tier.mode,
        market,
        bootstrap: Boolean(options.bootstrap)
      }
    };
    return { ran: true };
  }

  const sourceTier = cache.tiers[tier.sourceTierId] || {};
  const sourceRows = Array.isArray(sourceTier.rows) ? sourceTier.rows.slice().sort(compareScoreRows_) : [];
  if (!sourceRows.length) {
    return { ran: false, reason: marketTierLabel_(tier, market) + "은(는) 선행 티어 결과가 필요합니다." };
  }

  const selected = sourceRows.slice(0, tier.limit || sourceRows.length);
  const deepResult = tier.mode === "light"
    ? { rows: refreshLightRows_(selected, market), metadata: { analyzedBatchCount: selected.length, cursor: 0 } }
    : analyzeTierRows_(tier, selected, seedMoney, cache, market);
  const rows = deepResult.rows.sort(compareScoreRows_);
  cache.tiers[tier.id] = {
    lastRunAt: new Date().toISOString(),
    rows,
    metadata: {
      selectionBasis: "score_rank",
      sourceTierId: tier.sourceTierId,
      sourceRowCount: sourceRows.length,
      rowCount: rows.length,
      mode: tier.mode,
      market,
      analyzedCount: deepResult.metadata.analyzedCount || 0,
      analyzedBatchCount: deepResult.metadata.analyzedBatchCount || 0,
      cursor: deepResult.metadata.cursor || 0
    }
  };
  return { ran: true };
}

function runNasdaqFullScreeningTier_(tier, cache, pages, options) {
  options = options || {};
  const fallbackUniverse = getNasdaqBaseStocks_();
  const requestedItems = Math.max(Number(pages || 80), 1) * 50;
  const previousTier = cache.tiers[tier.id] || {};
  const previousRows = Array.isArray(previousTier.rows) ? previousTier.rows : [];
  const previousMetadata = previousTier.metadata || {};
  const knownUniverseCount = Number(previousMetadata.universeCount || fallbackUniverse.length || requestedItems);
  const maxItems = Math.min(requestedItems, Math.max(knownUniverseCount, fallbackUniverse.length, NASDAQ_FULL_BATCH_SIZE));
  if (!maxItems) return { ran: false, reason: "나스닥 기준 종목 목록을 가져오지 못했습니다." };
  const cursor = Math.max(0, Number(previousMetadata.cursor || 0)) % maxItems;
  const batchSize = Math.min(NASDAQ_FULL_BATCH_SIZE, maxItems);
  let batchRows = [];
  let universeCount = maxItems;
  try {
    const screener = fetchNasdaqScreenerRows_(batchSize, cursor);
    batchRows = screener.rows;
    universeCount = Math.min(requestedItems, Math.max(screener.totalRecords || 0, batchRows.length, fallbackUniverse.length));
  } catch (error) {
    const fallbackMax = Math.min(maxItems, fallbackUniverse.length);
    const batchStocks = [];
    for (let offset = 0; offset < batchSize && fallbackMax; offset += 1) {
      batchStocks.push(fallbackUniverse[(cursor + offset) % fallbackMax]);
    }
    batchRows = fetchNasdaqMarketSummaryBatch_(batchStocks);
    universeCount = fallbackMax || maxItems;
  }
  const summaryRows = batchRows.map(scoreMarketRow_);
  const rows = combineRankedRows_(summaryRows, previousRows).slice(0, maxItems);
  const nextCursor = (cursor + batchSize) % Math.max(universeCount, 1);
  cache.tiers[tier.id] = {
    lastRunAt: new Date().toISOString(),
    rows,
    metadata: {
      selectionBasis: options.bootstrap ? "initial_bootstrap_incremental" : "full_universe_incremental",
      rowCount: rows.length,
      mode: tier.mode,
      market: "NASDAQ",
      bootstrap: Boolean(options.bootstrap),
      batchSize,
      analyzedBatchCount: summaryRows.length,
      cursor: nextCursor,
      universeCount,
      coverageCount: rows.length,
      completedSweep: nextCursor <= cursor
    }
  };
  return {
    ran: true,
    partial: rows.length < universeCount || nextCursor !== 0,
    message: "나스닥 전체 분석 " + summaryRows.length + "개 갱신, 누적 " + rows.length + "/" + universeCount + "개입니다. 전체 커버리지는 여러 번 갱신하면 채워집니다."
  };
}

function analyzeTierRows_(tier, sourceRows, seedMoney, cache, market) {
  market = marketCode_(market || cache.market);
  const previousRows = tierRows_(cache, tier.id);
  const previousByTicker = {};
  previousRows.forEach((row) => {
    if (row && row.ticker) previousByTicker[row.ticker] = row;
  });
  const baseByTicker = {};
  sourceRows.forEach((row) => {
    baseByTicker[row.ticker] = previousByTicker[row.ticker] || Object.assign({}, row, {
      sourceTierScore: row.finalScore || null,
      reason: row.reason || "\uC120\uD589 \uD2F0\uC5B4 \uC810\uC218 \uC0C1\uC704 \uD6C4\uBCF4"
    });
  });

  const batch = selectDeepBatch_(tier, sourceRows, cache);
  batch.rows.forEach((row) => {
    try {
      baseByTicker[row.ticker] = analysisToScreenerRow_(analyzeStock_(row.ticker, seedMoney, row.market || market), row);
    } catch (error) {
      baseByTicker[row.ticker] = Object.assign({}, baseByTicker[row.ticker] || row, {
        recommendation: "\uBD84\uC11D \uC2E4\uD328",
        reason: error.message || "\uC2EC\uCE35 \uBD84\uC11D \uC2E4\uD328"
      });
    }
  });
  const rows = sourceRows.map((row) => baseByTicker[row.ticker] || row);
  return {
    rows,
    metadata: {
      analyzedCount: rows.filter((row) => row && row.fetchedAt).length,
      analyzedBatchCount: batch.rows.length,
      cursor: batch.nextCursor
    }
  };
}

function selectDeepBatch_(tier, sourceRows, cache) {
  if (!sourceRows.length) return { rows: [], nextCursor: 0 };
  const tierCache = cache.tiers[tier.id] || {};
  const metadata = tierCache.metadata || {};
  const cursor = Math.max(0, Number(metadata.cursor || 0)) % sourceRows.length;
  const size = Math.min(Math.max(Number(tier.batchSize || 8), 1), sourceRows.length);
  const rows = [];
  for (let offset = 0; offset < size; offset += 1) {
    rows.push(sourceRows[(cursor + offset) % sourceRows.length]);
  }
  return {
    rows,
    nextCursor: (cursor + size) % sourceRows.length
  };
}

function analysisToScreenerRow_(analysis, fallback) {
  return {
    ticker: analysis.ticker,
    name: analysis.name || fallback.name || analysis.ticker,
    market: analysis.market || fallback.market || "KOSPI",
    currentPrice: analysis.currentPrice,
    fairValue: analysis.fairValue,
    finalScore: analysis.finalScore,
    recommendation: analysis.recommendation,
    reason: (analysis.reasons || []).join(", "),
    stopLoss: analysis.stopLoss,
    signal: analysis.signal,
    upside: analysis.upside,
    per: analysis.fundamental && analysis.fundamental.per,
    pbr: analysis.fundamental && analysis.fundamental.pbr,
    eps: analysis.fundamental && analysis.fundamental.eps,
    bps: analysis.fundamental && analysis.fundamental.bps,
    revenue: analysis.fundamental && analysis.fundamental.revenue,
    revenueGrowth: analysis.fundamental && analysis.fundamental.revenueGrowth,
    operatingIncomeGrowth: analysis.fundamental && analysis.fundamental.operatingIncomeGrowth,
    sourceTierScore: fallback.finalScore || null,
    fetchedAt: analysis.fetchedAt,
    priceFetchedAt: analysis.priceFetchedAt || analysis.fetchedAt,
    priceSource: analysis.priceSource || ""
  };
}

function refreshLightRows_(sourceRows, market) {
  market = marketCode_(market);
  return sourceRows.map((row) => {
    try {
      const quote = fetchQuoteByMarket_(row.ticker, row.market || market);
      const currentPrice = quote.currentPrice || row.currentPrice;
      const fairValue = row.fairValue || null;
      const upside = fairValue && currentPrice ? fairValue / currentPrice - 1 : row.upside;
      return Object.assign({}, row, {
        name: quote.name || row.name,
        currentPrice,
        previousClose: quote.previousClose || null,
        change: quote.change || null,
        changeRate: quote.changeRate || null,
        volume: quote.volume || row.volume || null,
        upside,
        fetchedAt: new Date().toISOString(),
        priceFetchedAt: quote.priceFetchedAt || new Date().toISOString(),
        priceSource: quote.quoteSource || row.priceSource || "",
        reason: "\uC0C1\uC704 20\uAC1C \uCD08\uB2E8\uC704 \uAC00\uACA9 \uBAA8\uB2C8\uD130\uB9C1"
      });
    } catch (error) {
      return Object.assign({}, row, {
        reason: "\uAC00\uACA9 \uBAA8\uB2C8\uD130\uB9C1 \uC2E4\uD328: " + (error.message || error)
      });
    }
  });
}

function firstDueTier_(cache, now) {
  for (let index = 0; index < SCREENING_TIERS.length; index += 1) {
    const tier = SCREENING_TIERS[index];
    if (tierIsDue_(tier, cache, now)) return tier;
  }
  return null;
}

function tierIsDue_(tier, cache, now) {
  if (tier.sourceTierId && !tierRows_(cache, tier.sourceTierId).length) return false;
  if (!isTierAllowedNow_(tier, now)) return false;
  const lastRunAt = tierLastRunAt_(cache, tier.id);
  if (!lastRunAt) return true;
  return now.getTime() - lastRunAt.getTime() >= tier.intervalMs;
}

function isTierAllowedNow_(tier, now) {
  if (tier.windowStartHour == null || tier.windowEndHour == null) return true;
  const hour = Number(Utilities.formatDate(now, "Asia/Seoul", "H"));
  if (tier.windowStartHour <= tier.windowEndHour) {
    return hour >= tier.windowStartHour && hour < tier.windowEndHour;
  }
  return hour >= tier.windowStartHour || hour < tier.windowEndHour;
}

function tierLastRunAt_(cache, tierId) {
  const raw = cache.tiers && cache.tiers[tierId] && cache.tiers[tierId].lastRunAt;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function nextTierDueAt_(tier, cache, now) {
  const lastRunAt = tierLastRunAt_(cache, tier.id);
  if (!lastRunAt) return isTierAllowedNow_(tier, now) ? now : nextWindowStart_(tier, now);
  const candidate = new Date(lastRunAt.getTime() + tier.intervalMs);
  if (tier.windowStartHour == null) return candidate;
  return isTierAllowedNow_(tier, candidate) ? candidate : nextWindowStart_(tier, candidate > now ? candidate : now);
}

function nextWindowStart_(tier, now) {
  if (tier.windowStartHour == null) return now;
  const nowKstText = Utilities.formatDate(now, "Asia/Seoul", "yyyy/MM/dd");
  const todayStart = new Date(nowKstText + " " + twoDigits_(tier.windowStartHour) + ":00:00 GMT+0900");
  if (todayStart.getTime() >= now.getTime()) return todayStart;
  return new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
}

function buildScreeningResponse_(cache, limit, now, refreshedTierId, message, market) {
  market = marketCode_(market || cache.market);
  const fullRows = tierRows_(cache, "full_nightly");
  const top200Rows = combineRankedRows_(tierRows_(cache, "top_200_hourly"), fullRows).slice(0, 200);
  const top50Rows = combineRankedRows_(tierRows_(cache, "top_50_5min"), top200Rows).slice(0, 50);
  const top20Rows = combineRankedRows_(tierRows_(cache, "top_20_realtime"), top50Rows).slice(0, 20);
  const tierRows = {
    full_nightly: fullRows.slice(0, Math.min(limit, 200)),
    top_200_hourly: top200Rows,
    top_50_5min: top50Rows,
    top_20_realtime: top20Rows
  };
  const activeTierId = ["top_20_realtime", "top_50_5min", "top_200_hourly", "full_nightly"].find((tierId) => tierRows[tierId].length) || "full_nightly";
  const averageScore = fullRows.length ? avg_(fullRows.map((row) => row.finalScore || 0)) : null;
  return {
    ok: true,
    market,
    updatedAt: cache.updatedAt || "",
    averageScore: averageScore == null ? null : Math.round(averageScore * 10000) / 10000,
    refreshedTierId,
    activeTierId,
    message,
    tiers: SCREENING_TIERS.map((tier) => tierStatusPayload_(tier, cache, now, refreshedTierId, market)),
    tierRows,
    items: tierRows[activeTierId].slice(0, limit)
  };
}

function screeningFallbackResponse_(market, errorMessage) {
  try {
    market = marketCode_(market);
    const cache = normalizeScreeningCache_(loadScreeningCache_(market));
    cache.market = market;
    const response = buildScreeningResponse_(
      cache,
      200,
      new Date(),
      "",
      marketLabel_(market) + " 갱신은 실패했지만 기존 캐시를 표시합니다. 사유: " + String(errorMessage || "알 수 없는 오류"),
      market
    );
    response.warning = String(errorMessage || "");
    return response;
  } catch (fallbackError) {
    return { ok: false, error: errorMessage || fallbackError.message || String(fallbackError) };
  }
}

function combineRankedRows_() {
  const byTicker = {};
  for (let sourceIndex = 0; sourceIndex < arguments.length; sourceIndex += 1) {
    const rows = Array.isArray(arguments[sourceIndex]) ? arguments[sourceIndex] : [];
    rows.forEach((row) => {
      if (!row || !row.ticker) return;
      const previous = byTicker[row.ticker];
      byTicker[row.ticker] = mergeRankedRow_(previous, row);
    });
  }
  return Object.values(byTicker).sort(compareScoreRows_);
}

function mergeRankedRow_(previous, incoming) {
  if (!previous) return Object.assign({}, incoming);
  const incomingWins = rowScore_(incoming) >= rowScore_(previous);
  const merged = Object.assign({}, incomingWins ? previous : incoming, incomingWins ? incoming : previous);
  const freshPriceRow = rowPriceFreshness_(incoming) >= rowPriceFreshness_(previous) ? incoming : previous;
  if (freshPriceRow && Number(freshPriceRow.currentPrice) > 0) {
    ["currentPrice", "previousClose", "change", "changeRate", "volume", "priceFetchedAt", "priceSource", "fetchedAt"].forEach((key) => {
      if (freshPriceRow[key] != null && freshPriceRow[key] !== "") merged[key] = freshPriceRow[key];
    });
    if (merged.fairValue && merged.currentPrice) merged.upside = merged.fairValue / merged.currentPrice - 1;
  }
  return merged;
}

function rowPriceFreshness_(row) {
  if (!row) return 0;
  return Math.max(timestampValue_(row.priceFetchedAt), timestampValue_(row.fetchedAt));
}

function timestampValue_(value) {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function rowScore_(row) {
  const value = Number(row && row.finalScore);
  return Number.isFinite(value) ? value : -1;
}

function tierStatusPayload_(tier, cache, now, refreshedTierId, market) {
  market = marketCode_(market || cache.market);
  const tierCache = cache.tiers[tier.id] || {};
  const rows = Array.isArray(tierCache.rows) ? tierCache.rows : [];
  const metadata = tierCache.metadata || {};
  const nextDueAt = nextTierDueAt_(tier, cache, now);
  return {
    id: tier.id,
    label: marketTierLabel_(tier, market),
    scope: marketTierScope_(tier, market),
    limit: tier.limit,
    intervalMs: tier.intervalMs,
    intervalLabel: intervalLabel_(tier.intervalMs),
    mode: tier.mode,
    modeLabel: tier.modeLabel,
    sourceTierId: tier.sourceTierId || "",
    lastRunAt: tierCache.lastRunAt || "",
    nextDueAt: nextDueAt ? nextDueAt.toISOString() : "",
    isAllowedNow: isTierAllowedNow_(tier, now),
    isDue: tierIsDue_(tier, cache, now),
    rowCount: rows.length,
    analyzedCount: metadata.analyzedCount || 0,
    analyzedBatchCount: metadata.analyzedBatchCount || 0,
    blockedReason: tier.sourceTierId && !tierRows_(cache, tier.sourceTierId).length ? "\uC120\uD589 \uD2F0\uC5B4 \uB300\uAE30" : "",
    refreshed: tier.id === refreshedTierId,
    selectionBasis: metadata.selectionBasis || "",
    sourceRowCount: metadata.sourceRowCount || null
  };
}

function tierRows_(cache, tierId) {
  const tierCache = cache.tiers[tierId] || {};
  const rows = Array.isArray(tierCache.rows) ? tierCache.rows : [];
  return rows.slice().sort(compareScoreRows_);
}

function compareScoreRows_(a, b) {
  const aScore = Number(a.finalScore == null ? -1 : a.finalScore);
  const bScore = Number(b.finalScore == null ? -1 : b.finalScore);
  if (bScore !== aScore) return bScore - aScore;
  return String(a.name || "").localeCompare(String(b.name || ""), "ko");
}

function loadScreeningCache_(market) {
  try {
    const file = getNamedFile_(screeningFileName_(market));
    if (!file) return { tiers: {} };
    const text = file.getBlob().getDataAsString("UTF-8");
    if (!text) return { tiers: {} };
    return JSON.parse(text);
  } catch (error) {
    return { tiers: {}, recoveredFromError: String(error && error.message || error || "") };
  }
}

function saveScreeningCache_(cache, market) {
  const text = JSON.stringify(cache, null, 2);
  const file = getNamedFile_(screeningFileName_(market || cache.market));
  if (file) {
    file.setContent(text);
  } else {
    getFolder_().createFile(screeningFileName_(market || cache.market), text, MimeType.PLAIN_TEXT);
  }
}

function normalizeScreeningCache_(cache) {
  cache = cache && typeof cache === "object" ? cache : {};
  cache.tiers = cache.tiers && typeof cache.tiers === "object" ? cache.tiers : {};
  return cache;
}

function getNamedFile_(fileName) {
  const files = getFolder_().getFilesByName(fileName);
  return files.hasNext() ? files.next() : null;
}

function screeningFileName_(market) {
  return marketCode_(market) === "NASDAQ" ? "aisis-mobile-screening-cache-nasdaq.json" : SCREENING_FILE_NAME;
}

function intervalLabel_(intervalMs) {
  if (intervalMs >= 24 * 60 * 60 * 1000) return Math.round(intervalMs / (24 * 60 * 60 * 1000)) + "\uC77C";
  if (intervalMs >= 60 * 60 * 1000) return Math.round(intervalMs / (60 * 60 * 1000)) + "\uC2DC\uAC04";
  if (intervalMs >= 60 * 1000) return Math.round(intervalMs / (60 * 1000)) + "\uBD84";
  return Math.round(intervalMs / 1000) + "\uCD08";
}

function marketLabel_(market) {
  return marketCode_(market) === "NASDAQ" ? "나스닥" : "코스피";
}

function marketTierLabel_(tier, market) {
  if (tier.id === "full_nightly") return marketLabel_(market) + " 전체 분석";
  return tier.label;
}

function marketTierScope_(tier, market) {
  if (tier.id === "full_nightly") return marketLabel_(market) + " BASE 전체";
  if (tier.id === "top_200_hourly") return marketLabel_(market) + " 전체 분석 점수 상위 200개";
  return tier.scope;
}

function twoDigits_(value) {
  return String(value).padStart(2, "0");
}

function scoreMarketRow_(stock) {
  if (marketCode_(stock.market) === "NASDAQ") return scoreNasdaqMarketRow_(stock);
  const pricedAt = new Date().toISOString();
  let valueScore = 60;
  let qualityScore = 60;
  if (stock.per && stock.per > 0 && stock.per <= 10) valueScore += 16;
  if (stock.per && stock.per > 10 && stock.per <= 15) valueScore += 8;
  if (stock.roe && stock.roe >= 10) qualityScore += 16;
  if (stock.roe && stock.roe >= 5) qualityScore += 8;
  const tradedValue = (stock.currentPrice || 0) * (stock.volume || 0);
  const liquidityScore = tradedValue >= 20000000000 ? 90 : tradedValue >= 5000000000 ? 80 : tradedValue >= 1000000000 ? 70 : tradedValue >= 100000000 ? 60 : 40;
  const safetyScore = stock.marketCap && stock.marketCap >= 5000 ? 75 : 60;
  const finalScore = clamp_(valueScore) * 0.2 + clamp_(qualityScore) * 0.25 + 60 * 0.15 + 60 * 0.2 + safetyScore * 0.1 + liquidityScore * 0.1;
  const rounded = Math.round(finalScore * 10) / 10;
  return {
    ticker: stock.ticker,
    name: stock.name,
    market: stock.market,
    currentPrice: stock.currentPrice,
    marketCap: stock.marketCap,
    volume: stock.volume,
    per: stock.per,
    pbr: stock.pbr,
    eps: stock.eps,
    bps: stock.bps,
    roe: stock.roe,
    fetchedAt: pricedAt,
    priceFetchedAt: pricedAt,
    priceSource: stock.priceSource || "naver_market_summary",
    finalScore: rounded,
    recommendation: rounded >= 80 ? "강력 매수 후보" : rounded >= 70 ? "관심 후보" : rounded >= 60 ? "관찰" : "제외"
  };
}

function scoreNasdaqMarketRow_(stock) {
  let valueScore = 58;
  let qualityScore = 60;
  let growthScore = 60;
  let momentumScore = 55;
  let safetyScore = 60;
  const per = Number(stock.per);
  const pbr = Number(stock.pbr);
  const eps = Number(stock.eps);
  const bps = Number(stock.bps);
  const revenueGrowth = Number(stock.revenueGrowth);
  const marketCap = Number(stock.marketCap || 0);
  const currentPrice = Number(stock.currentPrice || 0);
  const ma50 = Number(stock.ma50 || 0);
  const ma200 = Number(stock.ma200 || 0);
  const volume = Number(stock.volume || 0);
  if (per > 0 && per <= 25) valueScore += 12;
  else if (per > 25 && per <= 40) valueScore += 4;
  else if (per > 60) valueScore -= 8;
  if (pbr > 0 && pbr <= 3) valueScore += 8;
  else if (pbr > 10) valueScore -= 5;
  if (marketCap >= 200000000000) safetyScore += 16;
  else if (marketCap >= 50000000000) safetyScore += 10;
  else if (marketCap >= 10000000000) safetyScore += 4;
  if (currentPrice && ma50 && currentPrice >= ma50) momentumScore += 12;
  if (ma50 && ma200 && ma50 >= ma200) momentumScore += 12;
  if (Number(stock.changeRate) > 0) momentumScore += 4;
  if (per > 0 && per <= 35 && marketCap >= 10000000000) qualityScore += 8;
  if (eps > 0) qualityScore += 6;
  if (bps > 0) qualityScore += 4;
  if (marketCap >= 50000000000) qualityScore += 8;
  if (revenueGrowth > 0.15) growthScore += 10;
  else if (revenueGrowth > 0.05) growthScore += 5;
  else if (revenueGrowth < -0.10) growthScore -= 6;
  const tradedValue = currentPrice * volume;
  const liquidityScore = tradedValue >= 5000000000 ? 90 : tradedValue >= 1000000000 ? 82 : tradedValue >= 250000000 ? 72 : tradedValue >= 50000000 ? 60 : 45;
  const finalScore = clamp_(valueScore) * 0.2 + clamp_(qualityScore) * 0.25 + clamp_(growthScore) * 0.15 + clamp_(momentumScore) * 0.2 + clamp_(safetyScore) * 0.1 + liquidityScore * 0.1;
  const rounded = Math.round(finalScore * 10) / 10;
  return {
    ticker: stock.ticker,
    name: stock.name,
    market: "NASDAQ",
    currentPrice: stock.currentPrice,
    marketCap: stock.marketCap,
    volume: stock.volume,
    per: stock.per,
    pbr: stock.pbr,
    eps: stock.eps,
    bps: stock.bps,
    revenue: stock.revenue,
    revenueGrowth: stock.revenueGrowth,
    roe: stock.roe,
    fairValue: stock.fairValue || null,
    finalScore: rounded,
    recommendation: rounded >= 80 ? "강력 매수 후보" : rounded >= 70 ? "관심 후보" : rounded >= 60 ? "관찰" : "제외"
  };
}

function fetchMarketSummaryByMarket_(pages, market) {
  return marketCode_(market) === "NASDAQ" ? fetchNasdaqMarketSummary_(pages) : fetchMarketSummary_(pages);
}

function fetchNasdaqMarketSummary_(pages) {
  try {
    return fetchNasdaqScreenerRows_(Math.min(Math.max(Number(pages || 80), 1) * 50, NASDAQ_FULL_BATCH_SIZE), 0).rows;
  } catch (error) {
    const baseUniverse = getNasdaqBaseStocks_();
    const maxItems = Math.min(Math.max(Number(pages || 80), 1) * 50, baseUniverse.length);
    return fetchNasdaqMarketSummaryBatch_(baseUniverse.slice(0, Math.min(maxItems, NASDAQ_FULL_BATCH_SIZE)));
  }
}

function fetchNasdaqScreenerRows_(limit, offset) {
  const size = Math.min(Math.max(Number(limit || NASDAQ_FULL_BATCH_SIZE), 1), NASDAQ_FULL_BATCH_SIZE);
  const start = Math.max(Number(offset || 0), 0);
  const url = "https://api.nasdaq.com/api/screener/stocks?tableonly=true&exchange=NASDAQ&limit=" + encodeURIComponent(size) + "&offset=" + encodeURIComponent(start);
  const payload = JSON.parse(fetchText_(url, "UTF-8"));
  const data = (payload || {}).data || {};
  const table = data.table || {};
  const rows = (table.rows || []).map(parseNasdaqScreenerRow_).filter(Boolean);
  return {
    rows,
    totalRecords: Number(data.totalrecords || data.totalRecords || rows.length || 0)
  };
}

function parseNasdaqScreenerRow_(row) {
  const ticker = normalizeNasdaqSymbol_(row && row.symbol);
  const name = cleanNasdaqSecurityName_(row && row.name);
  if (!ticker || !name || !isCompanyLikeNasdaqSecurity_(ticker, name)) return null;
  return {
    ticker,
    name,
    market: "NASDAQ",
    currentPrice: toNumber_(row.lastsale),
    marketCap: toNumber_(row.marketCap),
    change: toNumber_(row.netchange),
    changeRate: toNumber_(row.pctchange)
  };
}

function fetchNasdaqMarketSummaryBatch_(stocks) {
  const baseRows = (stocks || []).map((stock) => ({
    ticker: normalizeNasdaqSymbol_(stock.ticker),
    name: stock.name,
    market: "NASDAQ"
  }));
  const byTicker = {};
  baseRows.forEach((row) => { byTicker[row.ticker] = row; });
  const symbols = baseRows.map((row) => row.ticker);
  for (let index = 0; index < symbols.length; index += 100) {
    const chunk = symbols.slice(index, index + 100);
    try {
      const url = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=" + encodeURIComponent(chunk.join(","));
      const payload = JSON.parse(fetchText_(url, "UTF-8"));
      const results = (((payload || {}).quoteResponse || {}).result || []);
      results.forEach((quote) => {
        const ticker = normalizeNasdaqSymbol_(quote.symbol);
        if (!ticker || !byTicker[ticker]) return;
        byTicker[ticker] = Object.assign({}, byTicker[ticker], {
          name: quote.shortName || quote.longName || byTicker[ticker].name,
          currentPrice: nullableNumber_(quote.regularMarketPrice),
          volume: nullableNumber_(quote.regularMarketVolume),
          marketCap: nullableNumber_(quote.marketCap),
          per: nullableNumber_(quote.trailingPE || quote.forwardPE),
          pbr: nullableNumber_(quote.priceToBook),
          eps: nullableNumber_(quote.epsTrailingTwelveMonths || quote.epsForward),
          bps: nullableNumber_(quote.bookValue),
          revenue: nullableNumber_(quote.totalRevenue),
          revenueGrowth: nullableNumber_(quote.revenueGrowth),
          ma50: nullableNumber_(quote.fiftyDayAverage),
          ma200: nullableNumber_(quote.twoHundredDayAverage),
          changeRate: nullableNumber_(quote.regularMarketChangePercent)
        });
      });
    } catch (error) {
      // Keep static base rows when Yahoo quote batch is temporarily unavailable.
    }
  }
  return Object.values(byTicker);
}

function fetchMarketSummary_(pages) {
  const stocks = [];
  const seen = {};
  const maxPages = Math.min(Math.max(Number(pages || 80), 1), 80);
  for (let page = 1; page <= maxPages; page += 1) {
    const url = "https://finance.naver.com/sise/sise_market_sum.naver?sosok=0&page=" + page;
    const text = fetchText_(url, "EUC-KR");
    const rows = parseMarketPage_(text);
    if (!rows.length) break;
    rows.forEach((stock) => {
      if (!seen[stock.ticker]) {
        stocks.push(stock);
        seen[stock.ticker] = true;
      }
    });
  }
  return stocks;
}

function parseMarketPage_(text) {
  const rows = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?\/item\/main\.naver\?code=\d{6}[\s\S]*?<\/tr>)/gi;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(text))) {
    const row = rowMatch[1];
    const item = /<a href="\/item\/main\.naver\?code=(\d{6})"[^>]*>([\s\S]*?)<\/a>/i.exec(row);
    if (!item) continue;
    const numbers = rowNumbers_(row);
    rows.push({
      ticker: item[1],
      name: stripTags_(item[2]),
      market: "KOSPI",
      currentPrice: numbers[0] || null,
      marketCap: numbers[4] || null,
      volume: numbers[7] || null,
      per: numbers[8] || null,
      roe: numbers[9] || null
    });
  }
  return rows;
}

function rowNumbers_(row) {
  const values = [];
  const regex = /<td[^>]*class="number"[^>]*>([\s\S]*?)<\/td>/gi;
  let match;
  while ((match = regex.exec(row))) {
    values.push(toNumber_(stripTags_(match[1])));
  }
  return values;
}

function fetchText_(url, charset) {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36 AISIS-Mobile/1.0",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
  };
  if (/api\.nasdaq\.com/i.test(url)) {
    headers.Accept = "application/json,text/plain,*/*";
    headers.Origin = "https://www.nasdaq.com";
    headers.Referer = "https://www.nasdaq.com/";
  } else if (/naver\.com/i.test(url)) {
    headers.Referer = "https://m.stock.naver.com/";
  }
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers
  });
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) throw new Error("데이터 요청 실패: HTTP " + code);
  return charset ? response.getContentText(charset) : response.getContentText();
}

function sma_(values, period) {
  if (values.length < period) return null;
  return avg_(values.slice(values.length - period));
}

function rsiSeries_(values, period) {
  if (values.length <= period) return values.map(() => null);
  const gains = [null];
  const losses = [null];
  for (let i = 1; i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    gains.push(Math.max(diff, 0));
    losses.push(Math.max(-diff, 0));
  }
  const avgGain = ewm_(gains, period);
  const avgLoss = ewm_(losses, period);
  return values.map((_, index) => {
    const gain = avgGain[index];
    const loss = avgLoss[index];
    if (gain == null || loss == null) return null;
    if (gain <= 0) return 0;
    if (loss <= 0) return 100;
    const rs = gain / loss;
    return Math.max(0, Math.min(100, 100 - 100 / (1 + rs)));
  });
}

function atr_(prices, period) {
  if (prices.length <= period) return null;
  const trs = [];
  for (let i = 0; i < prices.length; i += 1) {
    const row = prices[i];
    const prev = prices[i - 1];
    if (!prev) {
      trs.push(row.high - row.low);
    } else {
      trs.push(Math.max(row.high - row.low, Math.abs(row.high - prev.close), Math.abs(row.low - prev.close)));
    }
  }
  return last_(ewm_(trs, period));
}

function calculateVwap_(prices) {
  let amount = 0;
  let volume = 0;
  prices.forEach((row) => {
    const typical = (row.high + row.low + row.close) / 3;
    amount += typical * row.volume;
    volume += row.volume;
  });
  return volume ? amount / volume : null;
}

function ewm_(values, period) {
  const alpha = 1 / period;
  let ema = null;
  let count = 0;
  return values.map((raw) => {
    if (raw == null) return null;
    const value = Number(raw);
    if (!Number.isFinite(value)) return null;
    count += 1;
    ema = ema == null ? value : (1 - alpha) * ema + alpha * value;
    return count >= period ? ema : null;
  });
}

function bullishDivergence_(closes, rsiValues, lookback, maxDistance) {
  const pivots = [];
  for (let idx = lookback; idx < closes.length - lookback; idx += 1) {
    const window = closes.slice(idx - lookback, idx + lookback + 1);
    if (closes[idx] === Math.min.apply(null, window)) pivots.push(idx);
  }
  let active = false;
  for (let i = 1; i < pivots.length; i += 1) {
    const previous = pivots[i - 1];
    const current = pivots[i];
    if (current - previous > maxDistance) continue;
    const lowerPriceLow = closes[current] < closes[previous];
    const higherRsiLow = Number(rsiValues[current]) > Number(rsiValues[previous]);
    if (lowerPriceLow && higherRsiLow) active = true;
  }
  return active;
}

function zscoreLast_(values, period) {
  if (values.length < period) return null;
  const slice = values.slice(values.length - period);
  const mean = avg_(slice);
  const variance = avg_(slice.map((value) => Math.pow(value - mean, 2)));
  const sd = Math.sqrt(variance);
  return sd ? (slice[slice.length - 1] - mean) / sd : 0;
}

function avg_(values) {
  const valid = values.filter((value) => Number.isFinite(Number(value)));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + Number(value), 0) / valid.length;
}

function std_(values) {
  const valid = values.filter((value) => Number.isFinite(Number(value))).map(Number);
  if (!valid.length) return 0;
  const mean = avg_(valid);
  return Math.sqrt(avg_(valid.map((value) => Math.pow(value - mean, 2))));
}

function last_(values) {
  return values[values.length - 1];
}

function marketCode_(value) {
  return String(value || "KOSPI").toUpperCase() === "NASDAQ" ? "NASDAQ" : "KOSPI";
}

function normalizeTicker_(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 6) throw new Error("국내 주식 종목코드 6자리를 입력하세요.");
  return digits;
}

function normalizeNasdaqSymbol_(value) {
  const raw = String(value || "").trim().toUpperCase();
  const firstToken = raw.split(/\s+/)[0] || raw;
  return firstToken.replace(/[^A-Z0-9.\-]/g, "").slice(0, 12);
}

function normalizeText_(value) {
  return String(value || "").toLowerCase().replace(/[\s\-_.(),]/g, "");
}

function toNumber_(value) {
  const text = String(value || "").replace(/,/g, "").replace(/%/g, "").trim();
  const match = /[-+]?\d+(?:\.\d+)?/.exec(text);
  return match ? Number(match[0]) : null;
}

function nullableNumber_(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function stripTags_(value) {
  return String(value || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function clamp_(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

function isAuthorized_(token) {
  return String(token || "") === SYNC_TOKEN;
}

function safeCallback_(callback) {
  const value = String(callback || "");
  return /^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)?$/.test(value) ? value : "";
}

function output_(payload, callback) {
  const json = JSON.stringify(payload);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + json + ")").setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
