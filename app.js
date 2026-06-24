const STORAGE_KEY = "aisis-mobile-state-v1";
const SYNC_URL_KEY = "aisis-mobile-sync-url-v1";
const SYNC_TOKEN_KEY = "aisis-mobile-sync-token-v1";
const SYNC_AUTO_KEY = "aisis-mobile-sync-auto-v1";
const SEED_MONEY_KEY = "aisis-mobile-seed-money-v1";
const SCREEN_PAGES_KEY = "aisis-mobile-screen-pages-v1";
const SYNC_DEBOUNCE_MS = 1200;
const POLL_INTERVAL_MS = 60 * 1000;
const HOLDINGS_POLL_INTERVAL_MS = 5 * 1000;
const CANDIDATE_POLL_INTERVAL_MS = 30 * 1000;
const SEARCH_DEBOUNCE_MS = 220;

const defaultState = {
  version: "aisis-mobile-v1",
  updatedAt: "",
  transactions: [],
  watchlist: [],
  analyses: {},
  screening: { updatedAt: "", averageScore: null, items: [], tiers: [], tierRows: {}, activeTierId: "" }
};

let state = loadLocalState();
let syncTimer = null;
let activeAnalysis = null;
let stockUniverse = [];
let searchTimer = null;
let transactionFormOpen = false;
let candidateDialogTierId = "";
let candidateDialogSort = "score_desc";
let candidateDialogFilters = new Set(["strong", "review", "watch", "other"]);

const els = {
  syncBadge: document.querySelector("#syncBadge"),
  refreshAllButton: document.querySelector("#refreshAllButton"),
  stockQuery: document.querySelector("#stockQuery"),
  stockSuggestions: document.querySelector("#stockSuggestions"),
  analyzeButton: document.querySelector("#analyzeButton"),
  signalBoard: document.querySelector("#signalBoard"),
  trafficLight: document.querySelector("#trafficLight"),
  signalLabel: document.querySelector("#signalLabel"),
  signalTitle: document.querySelector("#signalTitle"),
  analysisResult: document.querySelector("#analysisResult"),
  transactionForm: document.querySelector("#transactionForm"),
  openTransactionButton: document.querySelector("#openTransactionButton"),
  editingTransactionId: document.querySelector("#editingTransactionId"),
  txTicker: document.querySelector("#txTicker"),
  txBroker: document.querySelector("#txBroker"),
  txSide: document.querySelector("#txSide"),
  txDate: document.querySelector("#txDate"),
  txQuantity: document.querySelector("#txQuantity"),
  txPrice: document.querySelector("#txPrice"),
  txFee: document.querySelector("#txFee"),
  txMemo: document.querySelector("#txMemo"),
  refreshHoldingsButton: document.querySelector("#refreshHoldingsButton"),
  positionsList: document.querySelector("#positionsList"),
  screenKospiButton: document.querySelector("#screenKospiButton"),
  candidateSort: document.querySelector("#candidateSort"),
  candidateFilters: document.querySelectorAll(".candidate-filter"),
  marketSummary: document.querySelector("#marketSummary"),
  candidateList: document.querySelector("#candidateList"),
  candidateDialog: document.querySelector("#candidateDialog"),
  watchList: document.querySelector("#watchList"),
  settingsForm: document.querySelector("#settingsForm"),
  syncUrl: document.querySelector("#syncUrl"),
  syncToken: document.querySelector("#syncToken"),
  seedMoney: document.querySelector("#seedMoney"),
  screenPages: document.querySelector("#screenPages"),
  autoSync: document.querySelector("#autoSync"),
  pullButton: document.querySelector("#pullButton"),
  pushButton: document.querySelector("#pushButton"),
  statusBox: document.querySelector("#statusBox"),
  navButtons: document.querySelectorAll(".nav-button"),
  views: document.querySelectorAll(".view")
};

init();

function init() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
  els.txDate.value = new Date().toISOString().slice(0, 10);
  toggleTransactionForm(false);
  els.syncUrl.value = localStorage.getItem(SYNC_URL_KEY) || "";
  els.syncToken.value = localStorage.getItem(SYNC_TOKEN_KEY) || "";
  els.seedMoney.value = localStorage.getItem(SEED_MONEY_KEY) || "10000000";
  els.screenPages.value = localStorage.getItem(SCREEN_PAGES_KEY) || "80";
  els.autoSync.checked = localStorage.getItem(SYNC_AUTO_KEY) !== "false";

  bindEvents();
  loadStockUniverse().then(() => {
    repairStateStockNames();
    renderAll();
  });
  renderAll();
  syncOnStart();
  setInterval(() => refreshLiveData({ quiet: true }), POLL_INTERVAL_MS);
  setInterval(() => refreshHoldingsQuotes({ quiet: true }), HOLDINGS_POLL_INTERVAL_MS);
  setInterval(() => refreshCandidateTiers({ quiet: true }), CANDIDATE_POLL_INTERVAL_MS);
}

function bindEvents() {
  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });
  els.analyzeButton.addEventListener("click", () => analyzeQuery());
  els.stockQuery.addEventListener("input", () => queueStockSearch());
  els.stockQuery.addEventListener("focus", () => queueStockSearch());
  els.stockQuery.addEventListener("keydown", (event) => {
    if (event.key === "Enter") analyzeQuery();
    if (event.key === "Escape") hideStockSuggestions();
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-panel") && !event.target.closest("#stockSuggestions")) {
      hideStockSuggestions();
    }
  });
  els.refreshAllButton.addEventListener("click", () => refreshLiveData({ quiet: false }));
  els.refreshHoldingsButton.addEventListener("click", () => refreshHoldings());
  if (els.openTransactionButton) {
    els.openTransactionButton.addEventListener("click", () => toggleTransactionForm(true));
  }
  els.screenKospiButton.addEventListener("click", () => screenKospi());
  if (els.candidateSort) els.candidateSort.addEventListener("change", renderCandidates);
  els.candidateFilters.forEach((input) => input.addEventListener("change", renderCandidates));
  if (els.candidateList) {
    els.candidateList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-candidate-tier]");
      if (!button) return;
      openCandidateTier(button.dataset.candidateTier);
    });
  }
  els.transactionForm.addEventListener("submit", saveTransaction);
  els.settingsForm.addEventListener("submit", saveSettings);
  els.pullButton.addEventListener("click", () => pullSync({ quiet: false }));
  els.pushButton.addEventListener("click", () => pushSync({ quiet: false }));
}

function switchView(viewId) {
  els.views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  els.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewId));
}

function isViewActive(viewId) {
  return Boolean(document.querySelector(`#${viewId}.active`));
}

async function loadStockUniverse() {
  try {
    const response = await fetch("./kospi_stocks.json?v=20260624-watch", { cache: "no-store" });
    if (!response.ok) throw new Error("stock universe not found");
    const payload = await response.json();
    stockUniverse = Array.isArray(payload.items) ? payload.items : [];
  } catch (error) {
    stockUniverse = [];
  }
}

function queueStockSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(renderStockSuggestions, SEARCH_DEBOUNCE_MS);
}

async function renderStockSuggestions() {
  const query = els.stockQuery.value.trim();
  if (!shouldShowStockSuggestions(query)) {
    hideStockSuggestions();
    return;
  }
  let matches = searchStockUniverse(query, 12);
  if (!matches.length) {
    matches = await searchStocksRemotely(query);
  }
  if (!matches.length) {
    els.stockSuggestions.hidden = false;
    els.stockSuggestions.innerHTML = `<div class="suggestion-empty">일치하는 종목이 없습니다.</div>`;
    return;
  }
  els.stockSuggestions.hidden = false;
  els.stockSuggestions.innerHTML = matches
    .map((stock) => `
      <button class="suggestion-item" type="button" data-ticker="${escapeHtml(stock.ticker)}" data-name="${escapeHtml(stock.name || "")}" data-market="${escapeHtml(stock.market || "KOSPI")}">
        <strong>${escapeHtml(stock.ticker)} · ${escapeHtml(stock.name)}</strong>
        <span>${escapeHtml(stock.market || "KOSPI")}${stock.current_price ? ` · ${formatWon(stock.current_price)}` : ""}</span>
      </button>
    `)
    .join("");
  els.stockSuggestions.querySelectorAll(".suggestion-item").forEach((button) => {
    button.addEventListener("click", () => {
      const stock = stockUniverse.find((row) => row.ticker === button.dataset.ticker);
      selectStockSuggestion(stock || {
        ticker: button.dataset.ticker,
        name: button.dataset.name || "",
        market: button.dataset.market || "KOSPI"
      });
    });
  });
}

async function searchStocksRemotely(query) {
  const config = getSyncConfig();
  if (!config) return [];
  try {
    const payload = await jsonp(config.url, {
      action: "searchStocks",
      token: config.token,
      query,
      limit: "12"
    });
    if (!payload.ok) throw new Error(payload.error || "종목 검색 실패");
    return Array.isArray(payload.items) ? payload.items : [];
  } catch (error) {
    setStatus(friendlySyncError(error), "error");
    return [];
  }
}

function shouldShowStockSuggestions(query) {
  const digits = query.replace(/\D/g, "");
  if (digits && digits.length >= 4) return true;
  if (!digits && normalizeText(query).length >= 2) return true;
  return false;
}

function searchStockUniverse(query, limit = 12) {
  const digits = query.replace(/\D/g, "");
  const normalized = normalizeText(query);
  const scored = [];
  stockUniverse.forEach((stock) => {
    const name = normalizeText(stock.name || "");
    let score = 0;
    if (digits) {
      if (stock.ticker === digits) score = 100;
      else if (stock.ticker && stock.ticker.startsWith(digits)) score = 90;
      else return;
    } else {
      if (name === normalized) score = 100;
      else if (name.startsWith(normalized)) score = 90;
      else if (name.includes(normalized)) score = 70;
      else return;
    }
    scored.push({ ...stock, _score: score });
  });
  return scored
    .sort((a, b) => b._score - a._score || String(a.name).localeCompare(String(b.name), "ko"))
    .slice(0, limit);
}

function selectStockSuggestion(stock) {
  els.stockQuery.value = `${stock.ticker} ${stock.name}`;
  hideStockSuggestions();
  state.watchlist = state.watchlist.map((row) => (row.ticker === stock.ticker ? { ...row, name: stock.name } : row));
}

function hideStockSuggestions() {
  if (!els.stockSuggestions) return;
  els.stockSuggestions.hidden = true;
  els.stockSuggestions.innerHTML = "";
}

function loadLocalState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return normalizeState({ ...defaultState, ...saved });
  } catch (error) {
    return normalizeState(defaultState);
  }
}

function normalizeState(payload) {
  const screening = payload.screening && typeof payload.screening === "object"
    ? normalizeScreeningPayload(payload.screening)
    : defaultState.screening;
  return {
    ...defaultState,
    ...payload,
    transactions: Array.isArray(payload.transactions) ? payload.transactions : [],
    watchlist: Array.isArray(payload.watchlist) ? payload.watchlist : [],
    analyses: payload.analyses && typeof payload.analyses === "object" ? payload.analyses : {},
    screening
  };
}

function saveLocalState({ touch = true, push = true, immediatePush = false } = {}) {
  if (touch) state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
  if (immediatePush) {
    pushSync({ quiet: true });
  } else if (push) {
    queuePush();
  }
}

function renderAll() {
  renderSyncBadge();
  renderAnalysis(activeAnalysis);
  renderPositions();
  renderCandidates();
  renderWatchlist();
}

function renderSyncBadge() {
  const hasSync = Boolean(getSyncConfig());
  els.syncBadge.textContent = hasSync ? "Drive 연결" : "로컬";
}

async function analyzeQuery(query = els.stockQuery.value.trim()) {
  if (!query) {
    setStatus("종목 코드나 기업명을 입력하세요.");
    return;
  }
  const config = getSyncConfig();
  if (!config) {
    setStatus("설정에서 Apps Script URL과 동기화 비밀번호를 먼저 입력하세요.", "warn");
    switchView("settingsView");
    return;
  }
  setSignal("neutral", "분석 중", "현재가와 기준 점수를 계산하고 있습니다.");
  try {
    const payload = await jsonp(config.url, {
      action: "analyze",
      token: config.token,
      query,
      seedMoney: localStorage.getItem(SEED_MONEY_KEY) || "0"
    });
    if (!payload.ok) throw new Error(payload.error || "분석 실패");
    activeAnalysis = normalizeAnalysis(payload.analysis);
    if (activeAnalysis && activeAnalysis.ticker) {
      state.analyses[activeAnalysis.ticker] = activeAnalysis;
      rememberStock(activeAnalysis);
      saveLocalState();
      els.stockQuery.value = formatStockLabel(activeAnalysis);
    }
    setStatus("분석을 완료했습니다.");
  } catch (error) {
    const message = friendlySyncError(error);
    setSignal("red", "분석 실패", message);
    setStatus(message, "error");
    if (isUnauthorizedError(error)) switchView("settingsView");
  }
}

function renderAnalysis(analysis) {
  if (!analysis) {
    const latest = getLatestAnalysis();
    if (latest) analysis = latest;
  }
  if (!analysis) {
    els.analysisResult.innerHTML = `<div class="empty">분석할 종목을 입력하세요.</div>`;
    return;
  }
  analysis = normalizeAnalysis(analysis);
  activeAnalysis = analysis;
  const tone = signalTone(analysis);
  setSignal(tone, analysis.recommendation || "분석 완료", `${analysis.name || analysis.ticker} · ${formatScore(analysis.finalScore)}점`);
  const buyPlan = analysis.buyPlan || [];
  const plainSummary = buildPlainAnalysisSummary(analysis);
  els.analysisResult.innerHTML = `
    <article class="result-card">
      <div class="card-head">
        <h2>${escapeHtml(analysis.name || analysis.ticker)} <small>${escapeHtml(analysis.ticker || "")}</small></h2>
        <span class="chip ${tone === "red" ? "red" : tone === "yellow" ? "yellow" : ""}">${escapeHtml(analysis.recommendation || "-")}</span>
      </div>
      <div class="metric-grid">
        ${metric("현재가", formatWon(analysis.currentPrice))}
        ${metric("적정가", formatWon(analysis.fairValue))}
        ${metric("점수", `${formatScore(analysis.finalScore)}점`)}
        ${metric("손절가", formatWon(analysis.stopLoss))}
      </div>
      <div class="metric-grid">
        ${metric("PER", formatNumber(analysis.fundamental?.per))}
        ${metric("PBR", formatNumber(analysis.fundamental?.pbr))}
        ${metric("RSI", formatNumber(analysis.indicators?.rsi14))}
        ${metric("괴리율", formatPercent(analysis.upside))}
      </div>
      <div class="metric-grid">
        ${metric("매출", formatLargeWon(analysis.fundamental?.revenue))}
        ${metric("영업이익", formatLargeWon(analysis.fundamental?.operatingIncome))}
        ${metric("매출 성장", formatPercent(analysis.fundamental?.revenueGrowth))}
        ${metric("영업이익 성장", formatPercent(analysis.fundamental?.operatingIncomeGrowth))}
      </div>
      <div class="metric-grid">
        ${metric("실시간 거래량", formatShares(analysis.indicators?.liveVolume))}
        ${metric("20일 평균 대비", formatRatio(analysis.indicators?.liveVolumeRatio))}
        ${metric("거래량 Z", formatNumber(analysis.indicators?.volumeZscore))}
        ${metric("시세 출처", escapeHtml(analysis.source || "Naver"))}
      </div>
      <div class="plain-summary">
        <strong>쉬운 요약</strong>
        <p>${escapeHtml(plainSummary)}</p>
      </div>
      <ul class="note-list">
        ${(analysis.reasons || []).map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
      </ul>
      ${buyPlan.length ? `<div class="metric-grid">${buyPlan.map((row) => metric(row.label, `${formatWon(row.price)} · ${row.ratio}%`)).join("")}</div>` : ""}
      <div class="button-grid" style="margin-top:12px">
        <button class="ghost-button" type="button" onclick="addWatchlistFromActive()">관심 추가</button>
        <button class="ghost-button" type="button" onclick="prefillTransactionFromActive()">매수 입력</button>
      </div>
    </article>
  `;
}

function metric(label, value) {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value ?? "-")}</strong></div>`;
}

function setSignal(tone, label, title) {
  els.trafficLight.className = `traffic-light ${tone || "neutral"}`;
  els.signalLabel.textContent = label;
  els.signalTitle.textContent = title;
}

function signalTone(analysis) {
  const signal = String(analysis.signal || "").toLowerCase();
  if (signal === "green") return "green";
  if (signal === "red") return "red";
  return "yellow";
}

function buildPlainAnalysisSummary(analysis) {
  const score = Number(analysis.finalScore || 0);
  const ratio = fairValueRatio(analysis);
  const pbr = Number(analysis.fundamental?.pbr);
  const rsi = Number(analysis.indicators?.rsi14);
  const volume = Number(analysis.indicators?.volumeZscore);
  const revenueGrowth = Number(analysis.fundamental?.revenueGrowth);
  const operatingGrowth = Number(analysis.fundamental?.operatingIncomeGrowth);
  const good = [];
  const caution = [];

  if (ratio >= 1.5) good.push(`적정가가 현재가보다 ${formatRatio(ratio)} 높게 계산되어 가격 매력이 큽니다`);
  else if (ratio >= 1.1) good.push("적정가가 현재가보다 높아 가격 부담은 크지 않습니다");
  else caution.push("현재가가 적정가와 가깝거나 높아 가격 매력은 약합니다");

  if (Number.isFinite(pbr) && pbr > 0 && pbr <= 1) good.push("PBR이 1보다 낮아 회사 장부가치에 비해 싸게 거래되는 편입니다");
  else if (Number.isFinite(pbr) && pbr > 2) caution.push("PBR이 높아 자산가치 기준으로는 싸다고 보기 어렵습니다");

  if (Number.isFinite(rsi) && rsi >= 40 && rsi <= 75) good.push("최근 주가 흐름은 무너지지 않고 버티는 모습입니다");
  else if (Number.isFinite(rsi) && rsi > 80) caution.push("최근 단기 상승이 강해서 급하게 따라 사면 흔들릴 수 있습니다");
  else if (Number.isFinite(rsi) && rsi < 40) caution.push("최근 주가 힘은 아직 약합니다");

  if (Number.isFinite(volume) && volume > 1.5) good.push("거래량이 평소보다 늘어 시장 관심이 붙었습니다");
  if (Number.isFinite(revenueGrowth) && revenueGrowth > 0.05) good.push("매출이 전보다 늘어나는 흐름입니다");
  if (Number.isFinite(operatingGrowth) && operatingGrowth > 0.05) good.push("영업이익도 개선되고 있습니다");
  if (Number.isFinite(operatingGrowth) && operatingGrowth < -0.1) caution.push("영업이익 흐름은 약해지고 있어 확인이 필요합니다");

  if (analysis.recommendation === "강력 매수") {
    const goodText = good.slice(0, 3).join(". ") || "가격과 흐름 조건이 좋은 편입니다";
    return `${goodText}. 점수도 ${formatScore(score)}점으로 높아 강한 후보입니다.${caution.length ? " 다만 " + caution[0] + "." : ""}`;
  }
  if (analysis.recommendation === "매수 검토") {
    const goodText = good.slice(0, 2).join(". ") || "좋은 점이 일부 있습니다";
    return `${goodText}. 좋은 점은 있지만 ${caution[0] || "일부 조건이 아직 완전히 맞지는 않아"} 바로 확정 매수보다는 확인이 필요합니다.`;
  }
  if (analysis.recommendation && analysis.recommendation.includes("관심")) {
    return `${good[0] || "일부 지표는 나쁘지 않습니다"}. 하지만 ${caution[0] || "매수 조건이 아직 충분하지 않습니다"} 관심 목록에서 더 지켜보는 쪽이 맞습니다.`;
  }
  return `${caution[0] || "현재 기준으로 강한 매수 근거가 부족합니다"}. 좋은 신호가 더 생길 때까지 무리해서 살 필요는 없습니다.`;
}

function getLatestAnalysis() {
  const analyses = Object.values(state.analyses || {});
  return analyses.sort((a, b) => String(b.fetchedAt || "").localeCompare(String(a.fetchedAt || "")))[0] || null;
}

function saveTransaction(event) {
  event.preventDefault();
  const tickerInput = els.txTicker.value.trim();
  const remembered = findRememberedStock(tickerInput);
  const transaction = {
    id: els.editingTransactionId.value || makeId(),
    ticker: remembered?.ticker || normalizeTicker(tickerInput) || tickerInput,
    name: remembered?.name || tickerInput,
    broker: els.txBroker.value.trim() || "미지정",
    side: els.txSide.value,
    tradeDate: els.txDate.value,
    quantity: Number(els.txQuantity.value || 0),
    price: Number(els.txPrice.value || 0),
    fee: Number(els.txFee.value || 0),
    memo: els.txMemo.value.trim(),
    createdAt: new Date().toISOString()
  };
  if (!transaction.ticker || transaction.quantity <= 0 || transaction.price <= 0) {
    setStatus("종목, 수량, 단가를 확인하세요.", "warn");
    return;
  }
  state.transactions = state.transactions.filter((row) => row.id !== transaction.id);
  state.transactions.push(transaction);
  resetTransactionForm();
  toggleTransactionForm(false);
  saveLocalState({ immediatePush: true });
  setStatus("매수/매도 이력을 저장했습니다.");
}

function toggleTransactionForm(open = !transactionFormOpen) {
  transactionFormOpen = Boolean(open);
  if (!els.transactionForm) return;
  els.transactionForm.classList.toggle("is-hidden", !transactionFormOpen);
  if (els.openTransactionButton) {
    els.openTransactionButton.textContent = transactionFormOpen ? "입력 닫기" : "매수/매도 입력";
  }
}

function resetTransactionForm() {
  els.editingTransactionId.value = "";
  els.txTicker.value = "";
  els.txQuantity.value = "";
  els.txPrice.value = "";
  els.txFee.value = "0";
  els.txMemo.value = "";
}

function renderPositions() {
  const positions = calculatePositions(state.transactions);
  if (!positions.length) {
    els.positionsList.innerHTML = `<div class="empty">보유 이력이 없습니다.</div>`;
    return;
  }
  els.positionsList.innerHTML = positions
    .map((position) => {
      const analysis = state.analyses[position.ticker];
      const displayName = displayStockName(position.ticker, position.name);
      const currentPrice = analysis?.currentPrice || 0;
      const evalAmount = currentPrice ? currentPrice * position.quantity : 0;
      const pnl = evalAmount ? evalAmount - position.costBasis : 0;
      return `
        <article class="position-card" data-ticker="${escapeHtml(position.ticker)}">
          <div class="position-head">
            <strong>${escapeHtml(displayName)} <small>${escapeHtml(position.ticker)}</small></strong>
        <button class="ghost-button" type="button" onclick="openAnalysis('${escapeJs(position.ticker)}')">분석</button>
          </div>
          <div class="metric-grid">
            ${metric("수량", formatNumber(position.quantity))}
            ${metric("평단가", formatWon(position.avgPrice))}
            ${metric("현재가", currentPrice ? formatWon(currentPrice) : "-")}
            ${metric("평가손익", evalAmount ? formatWon(pnl) : "-")}
          </div>
          <div class="broker-list">
            ${position.brokers.map((broker) => `<div>${escapeHtml(broker.broker)} · ${formatNumber(broker.quantity)}주 · ${formatWon(broker.avgPrice)}</div>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");
  document.querySelectorAll(".position-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      card.classList.toggle("open");
    });
  });
}

function calculatePositions(transactions) {
  const byBroker = new Map();
  [...transactions]
    .sort((a, b) => `${a.tradeDate || ""}${a.createdAt || ""}`.localeCompare(`${b.tradeDate || ""}${b.createdAt || ""}`))
    .forEach((tx) => {
      const key = `${tx.ticker}::${tx.broker}`;
      const current = byBroker.get(key) || {
        ticker: tx.ticker,
        name: tx.name,
        broker: tx.broker,
        quantity: 0,
        costBasis: 0,
        realizedPnl: 0
      };
      if (tx.side === "매수") {
        current.quantity += Number(tx.quantity || 0);
        current.costBasis += Number(tx.quantity || 0) * Number(tx.price || 0) + Number(tx.fee || 0);
      } else {
        const sellQuantity = Math.min(current.quantity, Number(tx.quantity || 0));
        const avgPrice = current.quantity ? current.costBasis / current.quantity : 0;
        current.realizedPnl += Number(tx.price || 0) * sellQuantity - avgPrice * sellQuantity - Number(tx.fee || 0);
        current.quantity -= sellQuantity;
        current.costBasis -= avgPrice * sellQuantity;
        if (current.quantity <= 0.00000001) {
          current.quantity = 0;
          current.costBasis = 0;
        }
      }
      byBroker.set(key, current);
    });
  const grouped = new Map();
  [...byBroker.values()].filter((row) => row.quantity > 0).forEach((row) => {
    const position = grouped.get(row.ticker) || {
      ticker: row.ticker,
      name: row.name,
      quantity: 0,
      costBasis: 0,
      realizedPnl: 0,
      brokers: []
    };
    const brokerPosition = {
      broker: row.broker,
      quantity: row.quantity,
      avgPrice: row.quantity ? row.costBasis / row.quantity : 0,
      costBasis: row.costBasis,
      realizedPnl: row.realizedPnl
    };
    position.quantity += row.quantity;
    position.costBasis += row.costBasis;
    position.realizedPnl += row.realizedPnl;
    position.brokers.push(brokerPosition);
    grouped.set(row.ticker, position);
  });
  return [...grouped.values()].map((position) => ({
    ...position,
    avgPrice: position.quantity ? position.costBasis / position.quantity : 0
  }));
}

async function refreshHoldings() {
  const positions = calculatePositions(state.transactions);
  for (const position of positions) {
    await analyzeQuery(position.ticker);
  }
  switchView("portfolioView");
}

async function refreshHoldingsQuotes({ quiet = false } = {}) {
  if (!isViewActive("portfolioView")) return;
  const positions = calculatePositions(state.transactions);
  if (!positions.length) return;
  const config = getSyncConfig();
  if (!config) return;
  for (const position of positions) {
    try {
      const payload = await jsonp(config.url, {
        action: "quote",
        token: config.token,
        ticker: position.ticker
      });
      if (!payload.ok || !payload.quote) continue;
      const quote = payload.quote;
      const current = state.analyses[position.ticker] || {
        ticker: position.ticker,
        name: position.name,
        fetchedAt: ""
      };
      state.analyses[position.ticker] = normalizeAnalysis({
        ...current,
        ticker: position.ticker,
        name: quote.name || current.name || position.name,
        currentPrice: quote.currentPrice || current.currentPrice,
        previousClose: quote.previousClose || current.previousClose,
        change: quote.change || current.change,
        changeRate: quote.changeRate || current.changeRate,
        fetchedAt: new Date().toISOString()
      });
    } catch (error) {
      if (!quiet) setStatus(friendlySyncError(error), "error");
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderPositions();
  renderWatchlist();
}

async function screenKospi() {
  await refreshCandidateTiers({ quiet: false });
}

async function refreshCandidateTiers({ quiet = false } = {}) {
  if (quiet && !isViewActive("candidatesView")) return;
  const config = getSyncConfig();
  if (!config) {
    if (!quiet) setStatus("설정에서 Apps Script URL과 동기화 비밀번호를 먼저 입력하세요.", "warn");
    switchView("settingsView");
    return;
  }
  if (!quiet) setStatus("후보 티어를 확인하고 있습니다.");
  try {
    const payload = await jsonp(config.url, {
      action: "screenKospi",
      token: config.token,
      pages: localStorage.getItem(SCREEN_PAGES_KEY) || "80",
      limit: "200",
      seedMoney: localStorage.getItem(SEED_MONEY_KEY) || "0",
      priorityTickers: priorityCandidateTickers().join(",")
    });
    if (!payload.ok) throw new Error(payload.error || "후보 갱신 실패");
    state.screening = normalizeScreeningPayload(payload);
    saveLocalState({ touch: false, push: false });
    if (!quiet) setStatus(payload.message || "후보 티어를 확인했습니다.");
  } catch (error) {
    if (!quiet) setStatus(friendlySyncError(error), "error");
    if (isUnauthorizedError(error)) switchView("settingsView");
  }
}

function renderCandidates() {
  const screening = state.screening || defaultState.screening;
  const tierRows = screening.tierRows || {};
  const tiers = Array.isArray(screening.tiers) ? screening.tiers : [];
  const refreshedTier = tiers.find((tier) => tier.id === screening.refreshedTierId);
  els.marketSummary.innerHTML = `
    <div><strong>코스피 전체 평균</strong> ${screening.averageScore == null ? "-" : formatScore(screening.averageScore) + "점"}</div>
    <div><strong>마지막 갱신</strong> ${screening.updatedAt ? formatDateTime(screening.updatedAt) : "-"}</div>
    <div><strong>최근 실행</strong> ${refreshedTier ? escapeHtml(refreshedTier.label) : "캐시 표시"}</div>
  `;
  const tierCards = tiers.length ? `
    <div class="tier-grid">
      ${tiers.map(renderTierCard).join("")}
    </div>
  ` : "";
  const hasRows = Object.values(tierRows).some((rows) => Array.isArray(rows) && rows.length);
  if (!hasRows) {
    els.candidateList.innerHTML = `${tierCards}<div class="empty">후보 티어 갱신을 실행하세요. 전체 분석은 20:00~익일 08:00에 실행됩니다.</div>`;
    return;
  }
  els.candidateList.innerHTML = `${tierCards}<div class="empty">각 후보군 카드를 누르면 순위 목록이 팝업으로 열립니다.</div>`;
}

function renderTierCard(tier) {
  const statusClass = tier.refreshed ? "fresh" : tier.isDue ? "due" : tier.isAllowedNow ? "ready" : "locked";
  const statusText = tier.blockedReason || (tier.refreshed ? "방금 갱신" : tier.isDue ? "갱신 필요" : tier.isAllowedNow ? "대기" : "시간 전");
  return `
    <article class="tier-card ${statusClass}" role="button" tabindex="0" data-candidate-tier="${escapeHtml(tier.id || "")}">
      <div>
        <strong>${escapeHtml(tier.label || "")}</strong>
        <span>${escapeHtml(tier.scope || "")}</span>
      </div>
      <div class="tier-meta">
        <span>${escapeHtml(tier.intervalLabel || "")}</span>
        <span>${escapeHtml(tier.modeLabel || "")}</span>
        <span>${formatNumber(tier.rowCount || 0)}개</span>
        ${tier.analyzedCount ? `<span>심층 ${formatNumber(tier.analyzedCount)}개</span>` : ""}
      </div>
      <div class="tier-time">
        <span>${statusText}</span>
        <small>마지막 ${tier.lastRunAt ? formatDateTime(tier.lastRunAt) : "-"}</small>
        <small>다음 ${tier.nextDueAt ? formatDateTime(tier.nextDueAt) : "-"}</small>
      </div>
      <button class="ghost-button compact candidate-open-button" type="button">목록 보기</button>
    </article>
  `;
}

function openCandidateTier(tierId) {
  candidateDialogTierId = tierId;
  renderCandidateDialog();
}

function closeCandidateDialog() {
  candidateDialogTierId = "";
  if (els.candidateDialog) els.candidateDialog.innerHTML = "";
}

function renderCandidateDialog() {
  if (!els.candidateDialog || !candidateDialogTierId) return;
  const screening = state.screening || defaultState.screening;
  const tierRows = screening.tierRows || {};
  const tiers = Array.isArray(screening.tiers) ? screening.tiers : [];
  const tier = tiers.find((row) => row.id === candidateDialogTierId) || { id: candidateDialogTierId, label: tierLabel(candidateDialogTierId) };
  const rows = Array.isArray(tierRows[candidateDialogTierId]) ? tierRows[candidateDialogTierId] : [];
  const visibleRows = candidateRowsForDisplay(rows, {
    filters: candidateDialogFilters,
    sortMode: candidateDialogSort
  });
  const list = visibleRows.length
    ? visibleRows.map((rawItem, index) => renderCandidateCard(normalizeCandidate(rawItem), index)).join("")
    : `<div class="empty">조건에 맞는 후보가 없습니다. 필터를 넓혀보세요.</div>`;
  els.candidateDialog.innerHTML = `
    <div class="dialog-backdrop" onclick="closeCandidateDialog()">
      <section class="candidate-dialog" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        <div class="dialog-head">
          <div>
            <strong>${escapeHtml(tier.label || tierLabel(candidateDialogTierId))}</strong>
            <span>${formatNumber(rows.length)}개 후보 · ${escapeHtml(tier.modeLabel || "")}</span>
          </div>
          <button class="icon-button" type="button" onclick="closeCandidateDialog()">×</button>
        </div>
        <div class="candidate-controls dialog-controls">
          <select aria-label="후보 정렬" onchange="setCandidateDialogSort(this.value)">
            <option value="score_desc" ${candidateDialogSort === "score_desc" ? "selected" : ""}>점수 높은 순</option>
            <option value="ratio_desc" ${candidateDialogSort === "ratio_desc" ? "selected" : ""}>적정가 배율 높은 순</option>
            <option value="price_asc" ${candidateDialogSort === "price_asc" ? "selected" : ""}>현재가 낮은 순</option>
            <option value="name_asc" ${candidateDialogSort === "name_asc" ? "selected" : ""}>이름순</option>
          </select>
          ${renderDialogFilter("strong", "강력 매수")}
          ${renderDialogFilter("review", "매수 검토")}
          ${renderDialogFilter("watch", "관심/관찰")}
          ${renderDialogFilter("other", "기타")}
        </div>
        <div class="dialog-list">${list}</div>
      </section>
    </div>
  `;
}

function renderDialogFilter(value, label) {
  return `
    <label>
      <input type="checkbox" value="${value}" ${candidateDialogFilters.has(value) ? "checked" : ""} onchange="toggleCandidateDialogFilter('${value}', this.checked)" />
      ${label}
    </label>
  `;
}

function setCandidateDialogSort(value) {
  candidateDialogSort = value;
  renderCandidateDialog();
}

function toggleCandidateDialogFilter(value, checked) {
  if (checked) candidateDialogFilters.add(value);
  else candidateDialogFilters.delete(value);
  renderCandidateDialog();
}

function renderCandidateCard(item, index) {
  const ratio = fairValueRatio(item);
  const watched = isWatchlisted(item.ticker);
  return `
    <article class="candidate-card">
      <div class="card-head">
        <strong>${index + 1}. ${escapeHtml(item.name)} <small>${escapeHtml(item.ticker)}</small></strong>
        <span class="chip ${Number(item.finalScore) >= 80 ? "" : "yellow"}">${formatScore(item.finalScore)}점</span>
      </div>
      <div class="candidate-meta">
        <span class="chip">${escapeHtml(item.recommendation || gradeLabel(item.finalScore))}</span>
        <span class="chip">PER ${formatNumber(item.per)}</span>
        <span class="chip">PBR ${formatNumber(item.pbr)}</span>
        <span class="chip">적정/현재 ${formatRatio(ratio)}</span>
        ${item.currentPrice ? `<span class="chip">현재가 ${formatWon(item.currentPrice)}</span>` : ""}
      </div>
      <div class="candidate-actions">
        <label class="watch-check">
          <input type="checkbox" ${watched ? "checked" : ""} onchange="toggleWatchlistFromCandidate('${escapeJs(item.ticker)}', '${escapeJs(item.name)}', this.checked)" />
          <span>관심</span>
        </label>
        <button class="ghost-button" type="button" onclick="openAnalysis('${escapeJs(item.ticker)}')">종목 분석</button>
      </div>
    </article>
  `;
}

function candidateRowsForDisplay(rows, options = {}) {
  const filters = options.filters || selectedCandidateFilters();
  return [...rows]
    .map(normalizeCandidate)
    .filter((row) => filters.has(candidateGroup(row)))
    .sort(candidateSortComparator(options.sortMode));
}

function selectedCandidateFilters() {
  const selected = new Set();
  els.candidateFilters.forEach((input) => {
    if (input.checked) selected.add(input.value);
  });
  return selected;
}

function candidateGroup(row) {
  const recommendation = String(row.recommendation || "");
  if (recommendation.includes("강력")) return "strong";
  if (recommendation.includes("매수 검토")) return "review";
  if (recommendation.includes("관심")) return "watch";
  if (recommendation.includes("관찰")) return "watch";
  return "other";
}

function candidateSortComparator(sortMode) {
  const mode = sortMode || els.candidateSort?.value || "score_desc";
  return (a, b) => {
    if (mode === "ratio_desc") return fairValueRatio(b) - fairValueRatio(a) || scoreValue(b) - scoreValue(a);
    if (mode === "price_asc") return Number(a.currentPrice || 0) - Number(b.currentPrice || 0);
    if (mode === "name_asc") return String(a.name || "").localeCompare(String(b.name || ""), "ko");
    return scoreValue(b) - scoreValue(a) || fairValueRatio(b) - fairValueRatio(a);
  };
}

function scoreValue(row) {
  const value = Number(row.finalScore);
  return Number.isFinite(value) ? value : -1;
}

function fairValueRatio(row) {
  const fair = Number(row.fairValue);
  const current = Number(row.currentPrice);
  return Number.isFinite(fair) && Number.isFinite(current) && current > 0 ? fair / current : 0;
}

function tierLabel(tierId) {
  if (tierId === "full_nightly") return "코스피 전체 분석";
  if (tierId === "top_200_hourly") return "점수 상위 200개";
  if (tierId === "top_50_5min") return "점수 상위 50개";
  if (tierId === "top_20_realtime") return "점수 상위 20개";
  return tierId;
}

function gradeLabel(score) {
  const value = Number(score || 0);
  if (value >= 80) return "강력 매수 후보";
  if (value >= 70) return "관심 후보";
  if (value >= 60) return "관찰";
  return "제외";
}

function openAnalysis(query) {
  closeCandidateDialog();
  switchView("analysisView");
  els.stockQuery.value = query;
  analyzeQuery(query);
}

function addWatchlistFromActive() {
  if (!activeAnalysis?.ticker) return;
  state.watchlist = state.watchlist.filter((row) => row.ticker !== activeAnalysis.ticker);
  state.watchlist.unshift({
    ticker: activeAnalysis.ticker,
    name: activeAnalysis.name,
    addedAt: new Date().toISOString()
  });
  saveLocalState({ immediatePush: true });
  setStatus("관심종목에 추가했습니다.");
}

function toggleWatchlistFromCandidate(ticker, name, checked) {
  ticker = normalizeTicker(ticker);
  if (!ticker) return;
  state.watchlist = state.watchlist.filter((row) => row.ticker !== ticker);
  if (checked) {
    const candidate = findCandidateByTicker(ticker);
    if (candidate) {
      state.analyses[ticker] = normalizeAnalysis({ ...(state.analyses[ticker] || {}), ...candidate, ticker });
    }
    state.watchlist.unshift({
      ticker,
      name: displayStockName(ticker, name),
      addedAt: new Date().toISOString()
    });
    setStatus("관심종목에 추가했습니다.");
  } else {
    setStatus("관심종목에서 제거했습니다.");
  }
  saveLocalState({ immediatePush: true });
}

function findCandidateByTicker(ticker) {
  const normalized = normalizeTicker(ticker);
  const tierRows = state.screening?.tierRows || {};
  for (const rows of Object.values(tierRows)) {
    const found = Array.isArray(rows) ? rows.find((row) => normalizeTicker(row.ticker) === normalized) : null;
    if (found) return found;
  }
  return null;
}

function isWatchlisted(ticker) {
  const normalized = normalizeTicker(ticker);
  return Boolean(normalized && state.watchlist.some((row) => row.ticker === normalized));
}

function renderWatchlist() {
  if (!els.watchList) return;
  const rows = state.watchlist.map((row) => {
    const ticker = normalizeTicker(row.ticker);
    return normalizeCandidate({
      ...row,
      ...(state.analyses[ticker] || {}),
      ticker,
      name: row.name || state.analyses[ticker]?.name
    });
  });
  if (!rows.length) {
    els.watchList.innerHTML = `<div class="empty">관심 종목이 없습니다. 후보나 분석 화면에서 관심을 체크하세요.</div>`;
    return;
  }
  els.watchList.innerHTML = rows.map((row) => `
    <article class="candidate-card">
      <div class="card-head">
        <strong>${escapeHtml(row.name || row.ticker)} <small>${escapeHtml(row.ticker || "")}</small></strong>
        <span class="chip ${Number(row.finalScore) >= 80 ? "" : "yellow"}">${formatScore(row.finalScore)}점</span>
      </div>
      <div class="candidate-meta">
        <span class="chip">현재가 ${formatWon(row.currentPrice)}</span>
        <span class="chip">적정가 ${formatWon(row.fairValue)}</span>
        <span class="chip">적정/현재 ${formatRatio(fairValueRatio(row))}</span>
      </div>
      <div class="candidate-actions">
        <button class="ghost-button" type="button" onclick="openAnalysis('${escapeJs(row.ticker)}')">분석</button>
        <button class="ghost-button" type="button" onclick="toggleWatchlistFromCandidate('${escapeJs(row.ticker)}', '${escapeJs(row.name)}', false)">삭제</button>
      </div>
    </article>
  `).join("");
}

function prefillTransactionFromActive() {
  if (!activeAnalysis?.ticker) return;
  els.txTicker.value = `${activeAnalysis.name} ${activeAnalysis.ticker}`;
  els.txPrice.value = Math.round(activeAnalysis.currentPrice || 0);
  switchView("portfolioView");
}

function rememberStock(analysis) {
  if (!analysis?.ticker) return;
  const normalized = normalizeAnalysis(analysis);
  state.watchlist = state.watchlist.map((row) => (row.ticker === normalized.ticker ? { ...row, name: normalized.name || row.name } : row));
}

function findRememberedStock(query) {
  const normalized = normalizeText(query);
  const ticker = normalizeTicker(query);
  const local = ticker ? findStockByTicker(ticker) : stockUniverse.find((row) => normalizeText(row.name || "") === normalized || normalizeText(row.name || "").includes(normalized));
  if (local) return local;
  const rows = [
    ...Object.values(state.analyses || {}).map((analysis) => ({ ticker: analysis.ticker, name: analysis.name })),
    ...state.watchlist
  ];
  return rows.find((row) => row.ticker === ticker || normalizeText(row.name || "") === normalized || normalizeText(row.name || "").includes(normalized));
}

function priorityCandidateTickers() {
  const tickers = new Set();
  Object.values(state.analyses || {}).forEach((analysis) => {
    if (analysis?.ticker) tickers.add(normalizeTicker(analysis.ticker));
  });
  state.watchlist.forEach((row) => {
    if (row?.ticker) tickers.add(normalizeTicker(row.ticker));
  });
  calculatePositions(state.transactions).forEach((position) => {
    if (position?.ticker) tickers.add(normalizeTicker(position.ticker));
  });
  return [...tickers].filter(Boolean).slice(0, 40);
}

function normalizeAnalysis(analysis) {
  if (!analysis) return analysis;
  const ticker = normalizeTicker(analysis.ticker || "");
  const name = displayStockName(ticker, analysis.name);
  return { ...analysis, ticker: ticker || analysis.ticker, name };
}

function normalizeCandidate(item) {
  if (!item) return item;
  const ticker = normalizeTicker(item.ticker || "");
  return { ...item, ticker: ticker || item.ticker, name: displayStockName(ticker, item.name) };
}

function normalizeScreeningPayload(payload) {
  const base = payload && typeof payload === "object" ? payload : {};
  const tierRows = {};
  const rawTierRows = base.tierRows && typeof base.tierRows === "object" ? base.tierRows : {};
  Object.entries(rawTierRows).forEach(([tierId, rows]) => {
    tierRows[tierId] = Array.isArray(rows) ? rows.map(normalizeCandidate) : [];
  });
  const items = Array.isArray(base.items) ? base.items.map(normalizeCandidate) : [];
  if (!Object.keys(tierRows).length && items.length) {
    tierRows[base.activeTierId || "top_200_hourly"] = items;
  }
  return {
    updatedAt: base.updatedAt || "",
    averageScore: base.averageScore == null ? null : Number(base.averageScore),
    refreshedTierId: base.refreshedTierId || "",
    activeTierId: base.activeTierId || "",
    message: base.message || "",
    tiers: Array.isArray(base.tiers) ? base.tiers : [],
    tierRows,
    items
  };
}

function repairStateStockNames() {
  Object.keys(state.analyses || {}).forEach((ticker) => {
    state.analyses[ticker] = normalizeAnalysis(state.analyses[ticker]);
  });
  state.watchlist = state.watchlist.map((row) => normalizeCandidate(row));
  state.screening = normalizeScreeningPayload(state.screening);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function findStockByTicker(ticker) {
  const normalized = normalizeTicker(ticker);
  if (!normalized) return null;
  return stockUniverse.find((row) => row.ticker === normalized) || null;
}

function displayStockName(ticker, fallback) {
  const local = findStockByTicker(ticker);
  if (local?.name) return local.name;
  const clean = cleanStockName(fallback);
  return clean || ticker || "";
}

function cleanStockName(value) {
  const text = String(value || "").trim();
  if (!text || isBrokenText(text)) return "";
  return text;
}

function isBrokenText(value) {
  const text = String(value || "");
  return text.includes("\uFFFD");
}

function formatStockLabel(stock) {
  const ticker = normalizeTicker(stock?.ticker || "");
  const name = displayStockName(ticker, stock?.name);
  return `${ticker} ${name}`.trim();
}

async function refreshLiveData({ quiet = false } = {}) {
  if (!quiet) setStatus("최신 데이터를 확인하고 있습니다.");
  if (activeAnalysis?.ticker) await analyzeQuery(activeAnalysis.ticker);
  if (!quiet) setStatus("새로고침 완료");
}

function saveSettings(event) {
  event.preventDefault();
  localStorage.setItem(SYNC_URL_KEY, els.syncUrl.value.trim());
  localStorage.setItem(SYNC_TOKEN_KEY, els.syncToken.value.trim());
  localStorage.setItem(SYNC_AUTO_KEY, els.autoSync.checked ? "true" : "false");
  localStorage.setItem(SEED_MONEY_KEY, els.seedMoney.value || "0");
  localStorage.setItem(SCREEN_PAGES_KEY, els.screenPages.value || "80");
  renderSyncBadge();
  setStatus("설정을 저장했습니다.");
}

function getSyncConfig() {
  const url = (localStorage.getItem(SYNC_URL_KEY) || els.syncUrl.value || "").trim();
  const token = (localStorage.getItem(SYNC_TOKEN_KEY) || els.syncToken.value || "").trim();
  if (!url || !token) return null;
  return { url, token };
}

function queuePush() {
  if (localStorage.getItem(SYNC_AUTO_KEY) === "false") return;
  if (!getSyncConfig()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => pushSync({ quiet: true }), SYNC_DEBOUNCE_MS);
}

async function syncOnStart() {
  if (!getSyncConfig()) return;
  await pullSync({ quiet: true, onlyIfRemoteNewer: true });
}

async function pullSync({ quiet = false, onlyIfRemoteNewer = false } = {}) {
  const config = getSyncConfig();
  if (!config) {
    if (!quiet) setStatus("동기화 설정이 없습니다.", "warn");
    return;
  }
  try {
    const payload = await jsonp(config.url, { action: "load", token: config.token });
    if (!payload.ok) throw new Error(payload.error || "불러오기 실패");
    const remote = normalizeState(payload.state || defaultState);
    if (!onlyIfRemoteNewer || String(remote.updatedAt || "") > String(state.updatedAt || "")) {
      state = remote;
      repairStateStockNames();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderAll();
    }
    if (!quiet) setStatus("Google Drive에서 불러왔습니다.");
  } catch (error) {
    if (!quiet) setStatus(friendlySyncError(error), "error");
  }
}

async function pushSync({ quiet = false } = {}) {
  const config = getSyncConfig();
  if (!config) {
    if (!quiet) setStatus("동기화 설정이 없습니다.", "warn");
    return;
  }
  try {
    const body = new FormData();
    body.append("action", "save");
    body.append("token", config.token);
    body.append("payload", JSON.stringify({ state, updatedAt: state.updatedAt || new Date().toISOString() }));
    await fetch(config.url, { method: "POST", mode: "no-cors", body });
    if (!quiet) setStatus("Google Drive에 저장했습니다.");
  } catch (error) {
    if (!quiet) setStatus(friendlySyncError(error), "error");
  }
}

function jsonp(url, params) {
  return new Promise((resolve, reject) => {
    const callbackName = `aisisJsonp${Date.now()}${Math.random().toString(16).slice(2)}`;
    const endpoint = new URL(url);
    Object.entries(params).forEach(([key, value]) => endpoint.searchParams.set(key, value));
    endpoint.searchParams.set("callback", callbackName);
    const script = document.createElement("script");
    const cleanup = () => {
      delete window[callbackName];
      script.remove();
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("응답 시간이 초과되었습니다."));
    }, 45000);
    window[callbackName] = (payload) => {
      clearTimeout(timer);
      cleanup();
      resolve(payload);
    };
    script.onerror = () => {
      clearTimeout(timer);
      cleanup();
      reject(new Error("Apps Script에 연결하지 못했습니다."));
    };
    script.src = endpoint.toString();
    document.body.appendChild(script);
  });
}

function setStatus(message, tone = "neutral") {
  els.statusBox.textContent = message;
  els.statusBox.dataset.tone = tone;
}

function isUnauthorizedError(error) {
  return String(error?.message || error || "").toLowerCase().includes("unauthorized");
}

function friendlySyncError(error) {
  if (isUnauthorizedError(error)) {
    return "인증 실패: 앱 설정의 동기화 비밀번호와 Apps Script의 SYNC_TOKEN이 다릅니다. Code.gs 맨 위 SYNC_TOKEN을 확인하고 새 버전으로 배포하세요.";
  }
  return String(error?.message || error || "요청에 실패했습니다.");
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function normalizeTicker(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 6 ? digits : "";
}

function normalizeText(value) {
  return String(value || "").normalize("NFKC").toLowerCase().replace(/[\s\-_.(),]/g, "");
}

function formatWon(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${Math.round(number).toLocaleString("ko-KR")}원`;
}

function formatLargeWon(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  const eok = number / 100000000;
  if (Math.abs(eok) >= 1) return `${Math.round(eok).toLocaleString("ko-KR")}억원`;
  return formatWon(number);
}

function formatShares(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${Math.round(number).toLocaleString("ko-KR")}주`;
}

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return Number.isInteger(number) ? number.toLocaleString("ko-KR") : number.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function formatScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return number.toFixed(1);
}

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${(number * 100).toFixed(1)}%`;
}

function formatRatio(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "-";
  return `${number.toFixed(2)}배`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function escapeJs(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
