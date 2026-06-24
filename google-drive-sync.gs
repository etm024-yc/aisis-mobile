const SYNC_TOKEN = "CHANGE_ME_TO_A_LONG_RANDOM_SECRET";
const FOLDER_ID = "";
const FILE_NAME = "aisis-mobile-state.json";

function doGet(e) {
  const params = e.parameter || {};
  const callback = safeCallback_(params.callback);
  if (!isAuthorized_(params.token)) {
    return output_({ ok: false, error: "unauthorized" }, callback);
  }

  try {
    const action = String(params.action || "load");
    if (action === "load") return output_(loadSnapshot_(), callback);
    if (action === "quote") return output_({ ok: true, quote: fetchQuote_(params.ticker || params.query) }, callback);
    if (action === "analyze") return output_({ ok: true, analysis: analyzeStock_(params.query || params.ticker, Number(params.seedMoney || 0)) }, callback);
    if (action === "screenKospi") return output_(screenKospi_(Number(params.pages || 80), Number(params.limit || 200)), callback);
    return output_({ ok: false, error: "unknown action" }, callback);
  } catch (error) {
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

function analyzeStock_(query, seedMoney) {
  const resolved = resolveStock_(query);
  const ticker = resolved.ticker;
  const prices = fetchDailyPrices_(ticker, 260);
  const quote = fetchQuote_(ticker);
  const fundamental = fetchFundamental_(ticker);
  const currentPrice = quote.currentPrice || last_(prices).close;
  const indicators = calculateIndicators_(prices);
  const fairValue = calculateFairValue_(currentPrice, indicators, fundamental);
  const finalScore = calculateFinalScore_(currentPrice, fairValue, indicators, fundamental, prices);
  const atr = indicators.atr14 || currentPrice * 0.04;
  const stopLoss = Math.max(0, currentPrice - atr * 2);
  const upside = currentPrice > 0 ? fairValue / currentPrice - 1 : 0;
  const signal = finalScore >= 80 && upside >= 0.12 ? "green" : finalScore < 55 || upside < -0.15 ? "red" : "yellow";
  const recommendation = signal === "green" ? "강력 매수" : signal === "red" ? "매수 금지" : finalScore >= 70 ? "관심 후보" : "관찰";
  const buyPlan = buildBuyPlan_(currentPrice, fairValue, indicators, seedMoney);

  return {
    ticker,
    name: quote.name || resolved.name || ticker,
    market: resolved.market || "KOSPI",
    currentPrice,
    previousClose: quote.previousClose || null,
    change: quote.change || null,
    changeRate: quote.changeRate || null,
    fairValue,
    finalScore,
    signal,
    recommendation,
    stopLoss,
    upside,
    indicators,
    fundamental,
    buyPlan,
    reasons: buildReasons_(finalScore, upside, indicators, fundamental),
    fetchedAt: new Date().toISOString(),
    source: "Naver Finance + AISIS mobile"
  };
}

function resolveStock_(query) {
  const raw = String(query || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 6) return { ticker: digits, name: "", market: "KOSPI" };
  const stocks = fetchMarketSummary_(80);
  const normalized = normalizeText_(raw);
  const found = stocks.find((stock) => normalizeText_(stock.name) === normalized) ||
    stocks.find((stock) => normalizeText_(stock.name).indexOf(normalized) >= 0);
  if (!found) throw new Error("종목을 찾지 못했습니다. 6자리 종목코드로 다시 입력하세요.");
  return found;
}

function fetchQuote_(query) {
  const ticker = normalizeTicker_(query);
  const url = "https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:" + encodeURIComponent(ticker);
  const text = fetchText_(url);
  const payload = JSON.parse(text);
  const areas = (((payload || {}).result || {}).areas || []);
  const datas = areas.length ? areas[0].datas || [] : [];
  if (!datas.length) return { ticker, name: "", currentPrice: 0 };
  const data = datas[0];
  return {
    ticker,
    name: data.nm || "",
    currentPrice: Number(data.nv || data.closePrice || 0),
    previousClose: nullableNumber_(data.pcv),
    change: nullableNumber_(data.cv),
    changeRate: nullableNumber_(data.cr)
  };
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
  const text = fetchText_("https://finance.naver.com/item/main.naver?code=" + ticker, "EUC-KR");
  return {
    eps: latestMetric_(text, "EPS"),
    bps: latestMetric_(text, "BPS"),
    per: latestMetric_(text, "PER"),
    pbr: latestMetric_(text, "PBR")
  };
}

function latestMetric_(text, metric) {
  const row = new RegExp("<th[^>]*>\\s*(?:<strong>)?\\s*" + metric + "\\b.*?</th>(.*?)</tr>", "i").exec(text);
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

function calculateIndicators_(prices) {
  const closes = prices.map((row) => row.close);
  const volumes = prices.map((row) => row.volume);
  const ma20 = sma_(closes, 20);
  const ma60 = sma_(closes, 60);
  const ma120 = sma_(closes, 120);
  const ma240 = sma_(closes, 240);
  const vwap = calculateVwap_(prices.slice(-20));
  return {
    ma20,
    ma60,
    ma120,
    ma240,
    vwap,
    rsi14: rsi_(closes, 14),
    atr14: atr_(prices, 14),
    volumeZscore: zscoreLast_(volumes, 20),
    bullish: closes[closes.length - 1] > ma20 && ma20 > ma60
  };
}

function calculateFairValue_(currentPrice, indicators, fundamental) {
  const values = [];
  const technicalAnchors = [indicators.ma20, indicators.ma60, indicators.ma120, indicators.vwap].filter((value) => value && value > 0);
  if (technicalAnchors.length) values.push(avg_(technicalAnchors));
  if (fundamental.eps && fundamental.eps > 0) {
    const targetPer = fundamental.per && fundamental.per > 0 ? Math.min(14, Math.max(8, fundamental.per * 1.35)) : 10;
    values.push(fundamental.eps * targetPer);
    values.push(fundamental.eps * Math.max(7, targetPer * 0.85));
  }
  if (fundamental.bps && fundamental.bps > 0) {
    const targetPbr = fundamental.pbr && fundamental.pbr > 0 ? Math.min(1.2, Math.max(0.75, fundamental.pbr * 1.35)) : 0.85;
    values.push(fundamental.bps * targetPbr);
  }
  if (!values.length) return currentPrice;
  return Math.round(avg_(values));
}

function calculateFinalScore_(currentPrice, fairValue, indicators, fundamental, prices) {
  const valuationGap = currentPrice > 0 ? fairValue / currentPrice - 1 : 0;
  let valueScore = clamp_(60 + valuationGap * 140);
  let qualityScore = 60;
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
  const momentumScore = technicalScore_(indicators);
  const averageVolume = avg_(prices.slice(-20).map((row) => row.volume));
  const tradedValue = averageVolume * currentPrice;
  const liquidityScore = tradedValue >= 20000000000 ? 90 : tradedValue >= 5000000000 ? 80 : tradedValue >= 1000000000 ? 70 : tradedValue >= 100000000 ? 60 : 40;
  const finalScore = clamp_(valueScore) * 0.2 + clamp_(qualityScore) * 0.25 + 60 * 0.15 + momentumScore * 0.2 + clamp_(safetyScore) * 0.1 + liquidityScore * 0.1;
  return Math.round(finalScore * 10) / 10;
}

function technicalScore_(indicators) {
  let score = 50;
  if (indicators.ma20 && indicators.ma60 && indicators.ma20 > indicators.ma60) score += 12;
  if (indicators.ma60 && indicators.ma120 && indicators.ma60 > indicators.ma120) score += 10;
  if (indicators.rsi14 && indicators.rsi14 >= 35 && indicators.rsi14 <= 65) score += 12;
  if (indicators.rsi14 && indicators.rsi14 < 30) score += 6;
  if (indicators.volumeZscore && indicators.volumeZscore > 1) score += 8;
  if (indicators.bullish) score += 8;
  return clamp_(score);
}

function buildBuyPlan_(currentPrice, fairValue, indicators, seedMoney) {
  const base = Math.min(currentPrice, fairValue * 0.9, indicators.ma20 || currentPrice);
  const second = Math.min(base * 0.96, indicators.ma60 || base * 0.96);
  const third = Math.min(base * 0.92, indicators.ma120 || base * 0.92);
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

function screenKospi_(pages, limit) {
  const maxPages = Math.min(Math.max(Number(pages || 80), 1), 80);
  const maxItems = Math.min(Math.max(Number(limit || 200), 20), 300);
  const stocks = fetchMarketSummary_(maxPages);
  const scored = stocks.map(scoreMarketRow_).sort((a, b) => b.finalScore - a.finalScore);
  const averageScore = scored.length ? avg_(scored.map((row) => row.finalScore)) : null;
  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    averageScore: averageScore == null ? null : Math.round(averageScore * 10) / 10,
    items: scored.slice(0, maxItems)
  };
}

function scoreMarketRow_(stock) {
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
    roe: stock.roe,
    finalScore: rounded,
    recommendation: rounded >= 80 ? "강력 매수 후보" : rounded >= 70 ? "관심 후보" : rounded >= 60 ? "관찰" : "제외"
  };
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
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { "User-Agent": "AISIS-Mobile/1.0" }
  });
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) throw new Error("데이터 요청 실패: HTTP " + code);
  return charset ? response.getContentText(charset) : response.getContentText();
}

function sma_(values, period) {
  if (values.length < period) return null;
  return avg_(values.slice(values.length - period));
}

function rsi_(values, period) {
  if (values.length <= period) return null;
  let gains = 0;
  let losses = 0;
  const start = values.length - period;
  for (let i = start; i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function atr_(prices, period) {
  if (prices.length <= period) return null;
  const trs = [];
  for (let i = prices.length - period; i < prices.length; i += 1) {
    const row = prices[i];
    const prev = prices[i - 1];
    trs.push(Math.max(row.high - row.low, Math.abs(row.high - prev.close), Math.abs(row.low - prev.close)));
  }
  return avg_(trs);
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

function last_(values) {
  return values[values.length - 1];
}

function normalizeTicker_(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 6) throw new Error("국내 주식 종목코드 6자리를 입력하세요.");
  return digits;
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
