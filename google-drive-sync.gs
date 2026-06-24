const SYNC_TOKEN = "CHANGE_ME_TO_A_LONG_RANDOM_SECRET";
const FOLDER_ID = "";
const FILE_NAME = "aisis-mobile-state.json";
const FAIR_VALUE_WEIGHTS = {
  dcf_value: 0.30,
  per_value: 0.25,
  peg_value: 0.15,
  pbr_roe_value: 0.10,
  ev_ebitda_value: 0.10,
  technical_value: 0.10
};

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
    if (action === "searchStocks") return output_({ ok: true, items: searchStocks_(params.query, Number(params.limit || 20)) }, callback);
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
  let fundamental = fetchFundamental_(ticker);
  const currentPrice = quote.currentPrice || last_(prices).close;
  fundamental = mergeCurrentFundamentals_(ticker, currentPrice, fundamental);
  const indicators = calculateIndicators_(prices);
  const fairValue = calculateFairValue_(currentPrice, indicators, fundamental);
  const finalScore = calculateFinalScore_(currentPrice, fairValue, indicators, fundamental, prices);
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
    market: resolved.market || "KOSPI",
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
    source: "Naver Finance + AISIS mobile"
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

function fetchQuote_(query) {
  const ticker = normalizeTicker_(query);
  const url = "https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:" + encodeURIComponent(ticker);
  const text = fetchText_(url, "EUC-KR");
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
  const text = fetchText_("https://finance.naver.com/item/main.naver?code=" + ticker, "UTF-8");
  return {
    eps: latestMetric_(text, "EPS"),
    bps: latestMetric_(text, "BPS"),
    per: latestMetric_(text, "PER"),
    pbr: latestMetric_(text, "PBR"),
    dividend_yield: dividendYield_(text)
  };
}

function latestMetric_(text, metric) {
  const row = new RegExp("<th[^>]*>\\s*(?:<strong>)?\\s*" + metric + "\\b[\\s\\S]*?</th>([\\s\\S]*?)</tr>", "i").exec(text);
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
  const momentumScore = technicalScore_(indicators);
  const averageVolume = avg_(prices.slice(-20).map((row) => row.volume));
  const tradedValue = averageVolume * currentPrice;
  const liquidityScore = tradedValue >= 20000000000 ? 90 : tradedValue >= 5000000000 ? 80 : tradedValue >= 1000000000 ? 70 : tradedValue >= 100000000 ? 60 : 40;
  const finalScore = clamp_(valueScore) * 0.2 + clamp_(qualityScore) * 0.25 + 60 * 0.15 + momentumScore * 0.2 + clamp_(safetyScore) * 0.1 + liquidityScore * 0.1;
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
