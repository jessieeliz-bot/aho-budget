const STORAGE_KEY = "xx-money-v5";
const HIDDEN_TRANSACTIONS_KEY = "xx-money-hidden-transactions-v1";
const INSTALL_BANNER_KEY = "xx-money-install-banner-dismissed";
const SUPABASE_CONFIG_KEY = "xx-money-supabase-config-v1";
const SYNC_TABLE = "budget_state";

const sheetSeed = {
  weeklyLimit: 500,
  bankBalance: 104.72,
  rollover: 4021.65,
  savingsGoal: 2000,
  currentSavings: 0,
  debtTarget: "Debt paid off by 2030",
  currentPeriodStart: "2026-06-24",
  paychecks: [
    { id: "jessica-biweekly", name: "Jessica paycheck", date: "2026-06-26", amount: 1700, repeat: "biweekly" },
    { id: "troye-15", name: "Troye paycheck", date: "2026-06-15", amount: 1690, repeat: "monthly-15" },
    { id: "troye-30", name: "Troye paycheck", date: "2026-06-30", amount: 1700, repeat: "monthly-30" },
  ],
  bills: [
    { id: "rent", name: "Rent", date: "2026-06-01", amount: 1000, type: "bill", repeat: "monthly" },
    { id: "ent-payment", name: "ENT Payment", date: "2026-06-01", amount: 50, type: "bill", repeat: "monthly" },
    { id: "capital-one", name: "Capital One", date: "2026-06-03", amount: 27, type: "debt", repeat: "monthly" },
    { id: "car-insurance", name: "Car Insurance", date: "2026-06-03", amount: 208.8, type: "bill", repeat: "monthly" },
    { id: "moped", name: "Moped", date: "2026-06-03", amount: 100.37, type: "bill", repeat: "monthly" },
    { id: "klarna-mr", name: "Klarna MR", date: "2026-06-05", amount: 27.81, type: "debt", repeat: "monthly" },
    { id: "ceramics-school", name: "Ceramics School", date: "2026-06-08", amount: 125, type: "bill", repeat: "monthly" },
    { id: "kittypoo", name: "KittyPoo", date: "2026-06-09", amount: 24.48, type: "bill", repeat: "monthly" },
    { id: "natera", name: "Natera", date: "2026-06-11", amount: 47.79, type: "bill", repeat: "monthly" },
    { id: "bofa-cc", name: "BofA CC", date: "2026-06-12", amount: 67, type: "debt", repeat: "monthly" },
    { id: "one-main-12", name: "One Main", date: "2026-06-12", amount: 165, type: "debt", repeat: "monthly" },
    { id: "affirm-dw", name: "Affirm DW", date: "2026-06-14", amount: 20.99, type: "debt", repeat: "monthly" },
    { id: "capital-one-cc", name: "Capital One CC", date: "2026-06-14", amount: 25, type: "debt", repeat: "monthly" },
    { id: "quicksilver-cc", name: "Quicksilver CC", date: "2026-06-15", amount: 27, type: "debt", repeat: "monthly" },
    { id: "apple-cc", name: "Apple CC", date: "2026-06-15", amount: 42, type: "debt", repeat: "monthly" },
    { id: "settlement", name: "Settlement", date: "2026-06-16", amount: 309.77, type: "debt", repeat: "monthly" },
    { id: "affirm-dte1", name: "Affirm DTE1", date: "2026-06-17", amount: 24.51, type: "debt", repeat: "monthly" },
    { id: "dte", name: "DTE", date: "2026-06-18", amount: 200, type: "bill", repeat: "monthly" },
    { id: "affirm-ac", name: "Affirm AC", date: "2026-06-19", amount: 61.22, type: "debt", repeat: "monthly" },
    { id: "curex", name: "Curex", date: "2026-06-20", amount: 59, type: "bill", repeat: "monthly" },
    { id: "discover-cc", name: "Discover CC", date: "2026-06-21", amount: 35, type: "debt", repeat: "monthly" },
    { id: "lemonade-tillie", name: "Lemonade Tillie", date: "2026-06-21", amount: 16.89, type: "bill", repeat: "monthly" },
    { id: "xfinity", name: "Xfinity", date: "2026-06-22", amount: 65, type: "bill", repeat: "monthly" },
    { id: "affirm-mr", name: "Affirm MR", date: "2026-06-23", amount: 22.3, type: "debt", repeat: "monthly" },
    { id: "netflix", name: "Netflix", date: "2026-06-23", amount: 7.99, type: "bill", repeat: "monthly" },
    { id: "spotify", name: "Spotify", date: "2026-06-25", amount: 18.99, type: "bill", repeat: "monthly" },
    { id: "one-main-26", name: "One Main", date: "2026-06-26", amount: 166, type: "debt", repeat: "monthly" },
    { id: "chase-cc", name: "Chase CC", date: "2026-06-28", amount: 177, type: "debt", repeat: "monthly" },
    { id: "level-credit", name: "Level Credit", date: "2026-06-30", amount: 6.95, type: "debt", repeat: "monthly" },
  ],
  transactions: [],
};

let state = loadState();
let supabaseClient = null;
let syncTimer = null;
let isApplyingRemote = false;
let deferredInstallPrompt = null;

const els = {
  tabs: document.querySelectorAll("[data-tab]"),
  pages: document.querySelectorAll("[data-page]"),
  installBanner: document.querySelector("#installBanner"),
  installHelp: document.querySelector("#installHelp"),
  installAppButton: document.querySelector("#installAppButton"),
  dismissInstallBanner: document.querySelector("#dismissInstallBanner"),
  syncPanel: document.querySelector("#syncPanel"),
  syncForm: document.querySelector("#syncForm"),
  syncStatus: document.querySelector("#syncStatus"),
  syncNowButton: document.querySelector("#syncNowButton"),
  balanceForm: document.querySelector("#balanceForm"),
  balanceInput: document.querySelector("#balanceInput"),
  afterBills: document.querySelector("#afterBills"),
  paycheckTitle: document.querySelector("#paycheckTitle"),
  paycheckDate: document.querySelector("#paycheckDate"),
  payPeriodBills: document.querySelector("#payPeriodBills"),
  payPeriodBillsList: document.querySelector("#payPeriodBillsList"),
  forecastSummary: document.querySelector("#forecastSummary"),
  periodList: document.querySelector("#periodList"),
  pileLeft: document.querySelector("#pileLeft"),
  pileSpent: document.querySelector("#pileSpent"),
  protectedAhead: document.querySelector("#protectedAhead"),
  pileLimit: document.querySelector("#pileLimit"),
  potGroceries: document.querySelector("#potGroceries"),
  potGas: document.querySelector("#potGas"),
  potSpending: document.querySelector("#potSpending"),
  potGroceriesBar: document.querySelector("#potGroceriesBar"),
  potGasBar: document.querySelector("#potGasBar"),
  potSpendingBar: document.querySelector("#potSpendingBar"),
  weekRange: document.querySelector("#weekRange"),
  afterBillsLabel: document.querySelector("#afterBillsLabel"),
  bankBalance: document.querySelector("#bankBalance"),
  babyGoal: document.querySelector("#babyGoal"),
  currentSavings: document.querySelector("#currentSavings"),
  debtTarget: document.querySelector("#debtTarget"),
  billForm: document.querySelector("#billForm"),
  billFormTitle: document.querySelector("#billFormTitle"),
  billSubmitButton: document.querySelector("#billSubmitButton"),
  cancelBillEditButton: document.querySelector("#cancelBillEditButton"),
  customRepeat: document.querySelector("#customRepeat"),
  weekdayPicker: document.querySelector("#weekdayPicker"),
  recurringBillsTotal: document.querySelector("#recurringBillsTotal"),
  recurringBillsCount: document.querySelector("#recurringBillsCount"),
  recurringBillsList: document.querySelector("#recurringBillsList"),
  oneTimeBillsList: document.querySelector("#oneTimeBillsList"),
  incomeForm: document.querySelector("#incomeForm"),
  spendingForm: document.querySelector("#spendingForm"),
  statementFile: document.querySelector("#statementFile"),
  importStatus: document.querySelector("#importStatus"),
  transactionCount: document.querySelector("#transactionCount"),
  transactionList: document.querySelector("#transactionList"),
  categoryChips: document.querySelector("#categoryChips"),
  resetDemoButton: document.querySelector("#resetDemoButton"),
};

els.tabs.forEach((tab) => tab.addEventListener("click", switchTab));
els.installAppButton.addEventListener("click", installApp);
els.dismissInstallBanner.addEventListener("click", dismissInstallBanner);
els.syncForm.addEventListener("submit", saveSyncConfig);
els.syncNowButton.addEventListener("click", syncNow);
els.balanceForm.addEventListener("submit", updateBalance);
els.billForm.addEventListener("submit", addBill);
els.billForm.elements.repeat.addEventListener("change", updateCustomRepeatVisibility);
els.billForm.elements.repeatUnit.addEventListener("change", updateCustomRepeatVisibility);
els.cancelBillEditButton.addEventListener("click", cancelBillEdit);
els.recurringBillsList.addEventListener("click", handleBillPageAction);
els.oneTimeBillsList.addEventListener("click", handleBillPageAction);
els.incomeForm.addEventListener("submit", addIncome);
els.payPeriodBillsList.addEventListener("click", deleteBill);
els.spendingForm.addEventListener("submit", addManualSpending);
els.statementFile.addEventListener("change", importStatement);
els.transactionList.addEventListener("change", assignTransactionToBill);
els.transactionList.addEventListener("click", deleteTransaction);
els.transactionList.addEventListener("dblclick", hideTransaction);
els.resetDemoButton.addEventListener("click", resetApp);

registerServiceWorker();
listenForInstallPrompt();
render();
initializeSync();

function loadState() {
  try {
    return { ...sheetSeed, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return structuredClone(sheetSeed);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  queueRemoteSave();
}

function loadSyncConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(SUPABASE_CONFIG_KEY));
    if (!saved?.url || !saved?.anonKey || !saved?.householdId) return null;
    return saved;
  } catch {
    return null;
  }
}

function saveSyncConfig(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const config = {
    url: String(form.get("url") || "").trim().replace(/\/$/, ""),
    anonKey: String(form.get("anonKey") || "").trim(),
    householdId: String(form.get("householdId") || "").trim().toLowerCase(),
  };

  if (!config.url || !config.anonKey || !config.householdId) {
    setSyncStatus("Fill in all 3 sync fields", "bad");
    return;
  }

  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  setSyncStatus("Saved, syncing...", "working");
  initializeSync({ force: true });
}

async function initializeSync({ force = false } = {}) {
  const config = loadSyncConfig();
  fillSyncForm(config);

  if (!config) {
    setSyncStatus("Local only", "muted");
    return;
  }

  if (!window.supabase?.createClient) {
    setSyncStatus("Supabase library did not load", "bad");
    return;
  }

  if (!supabaseClient || force) {
    supabaseClient = window.supabase.createClient(config.url, config.anonKey);
  }

  await loadRemoteState(config);
}

function fillSyncForm(config) {
  if (!els.syncForm) return;
  els.syncForm.elements.url.value = config?.url || "";
  els.syncForm.elements.anonKey.value = config?.anonKey || "";
  els.syncForm.elements.householdId.value = config?.householdId || "";
}

async function loadRemoteState(config = loadSyncConfig()) {
  if (!supabaseClient || !config) return;

  try {
    setSyncStatus("Checking shared budget...", "working");
    const { data, error } = await supabaseClient
      .from(SYNC_TABLE)
      .select("data, updated_at")
      .eq("household_id", config.householdId)
      .maybeSingle();

    if (error) throw error;

    if (data?.data?.state) {
      applyRemoteData(data.data);
      setSyncStatus(`Synced ${formatSyncTime(data.updated_at)}`, "good");
      return;
    }

    await saveRemoteState();
    setSyncStatus("Shared budget created", "good");
  } catch (error) {
    setSyncStatus(`Sync error: ${error.message}`, "bad");
  }
}

function applyRemoteData(data) {
  isApplyingRemote = true;
  try {
    state = { ...structuredClone(sheetSeed), ...data.state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(HIDDEN_TRANSACTIONS_KEY, JSON.stringify(data.hiddenTransactionIds || []));
  } finally {
    isApplyingRemote = false;
  }
  render();
}

function sharedData() {
  return {
    appVersion: 1,
    state,
    hiddenTransactionIds: [...hiddenTransactions()],
  };
}

function queueRemoteSave() {
  if (isApplyingRemote || !supabaseClient || !loadSyncConfig()) return;
  clearTimeout(syncTimer);
  setSyncStatus("Saving...", "working");
  syncTimer = setTimeout(saveRemoteState, 700);
}

async function saveRemoteState() {
  const config = loadSyncConfig();
  if (!supabaseClient || !config) return;

  try {
    const { error } = await supabaseClient
      .from(SYNC_TABLE)
      .upsert({
        household_id: config.householdId,
        data: sharedData(),
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    setSyncStatus("Synced just now", "good");
  } catch (error) {
    setSyncStatus(`Sync error: ${error.message}`, "bad");
  }
}

async function syncNow() {
  if (!supabaseClient) await initializeSync();
  await saveRemoteState();
  await loadRemoteState();
}

function setSyncStatus(message, tone = "muted") {
  els.syncStatus.textContent = message;
  els.syncStatus.classList.remove("sync-good", "sync-bad", "sync-working", "sync-muted");
  els.syncStatus.classList.add(`sync-${tone}`);
}

function formatSyncTime(value) {
  if (!value) return "just now";
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function render() {
  const forecast = buildPayPeriodForecast(5);
  const currentPeriod = forecast[0];
  const spendingRange = currentPeriod ? { start: currentPeriod.start, end: currentPeriod.end } : currentSpendingPeriod();
  const periodTransactions = spendingTransactionsForRange(spendingRange.start, spendingRange.end);
  const actualPeriodSpending = periodTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  const plannedPeriodSpending = plannedWeeklySpendingForRange(spendingRange.start, spendingRange.end);
  const spent = actualPeriodSpending + plannedPeriodSpending;
  const periodLeft = Math.max(state.weeklyLimit - spent, 0);
  const payPeriod = currentPayPeriod();
  const payPeriodBills = requiredBillsBeforePaycheck(payPeriod);
  const payPeriodBillsTotal = payPeriodBills.reduce((total, bill) => total + bill.amount, 0);
  const afterBills = state.bankBalance - payPeriodBillsTotal;
  const safeToSpend = Math.max(Math.min(periodLeft, currentPeriod?.currentWeekReserve ?? afterBills), 0);
  const protectedAhead = Math.max(periodLeft - safeToSpend, 0);
  const pot = allocatePot(state.weeklyLimit, periodTransactions);
  const recurringBills = recurringBillSchedule();
  const oneTimeBills = oneTimeBillSchedule();
  const recurringBillsTotal = recurringBills.reduce((total, bill) => total + bill.amount, 0);
  const hiddenTransactionIds = hiddenTransactions();
  const visibleTransactions = state.transactions.filter((transaction) => !hiddenTransactionIds.has(transaction.id));

  els.installBanner.classList.toggle("hidden", localStorage.getItem(INSTALL_BANNER_KEY) === "yes");
  updateInstallBanner();
  els.balanceInput.value = state.bankBalance.toFixed(2);
  els.paycheckTitle.textContent = `${payPeriod.label}: ${payPeriod.dates}`;
  els.paycheckDate.textContent = "";
  els.afterBillsLabel.textContent = `Checking after bills before ${payPeriod.dates}`;
  setMoney(els.afterBills, afterBills);
  setMoney(els.payPeriodBills, -payPeriodBillsTotal);
  els.payPeriodBillsList.innerHTML = payPeriodBills.map(renderBill).join("") || `<p class="empty">No required bills before payday.</p>`;
  setMoney(els.pileLeft, safeToSpend);
  setMoney(els.pileSpent, -spent);
  setMoney(els.protectedAhead, -protectedAhead);
  setMoney(els.pileLimit, state.weeklyLimit);
  els.potGroceries.textContent = pot.groceriesLabel;
  els.potGas.textContent = pot.gasLabel;
  els.potSpending.textContent = pot.spendingLabel;
  els.potGroceriesBar.style.width = `${pot.groceriesPercent}%`;
  els.potGasBar.style.width = `${pot.gasPercent}%`;
  els.potSpendingBar.style.width = `${pot.spendingPercent}%`;
  els.weekRange.textContent = `${shortDate(spendingRange.start)} - ${shortDate(spendingRange.end)}`;
  els.forecastSummary.textContent = `${forecast.length} pay periods`;
  els.periodList.innerHTML = forecast.map(renderPayPeriod).join("");
  setMoney(els.bankBalance, state.bankBalance);
  setMoney(els.babyGoal, state.savingsGoal);
  setMoney(els.currentSavings, state.currentSavings);
  els.debtTarget.textContent = state.debtTarget;
  setMoney(els.recurringBillsTotal, -recurringBillsTotal);
  els.recurringBillsCount.textContent = String(recurringBills.length);
  els.recurringBillsList.innerHTML = recurringBills.map(renderScheduleBill).join("") || `<p class="empty">No recurring bills yet.</p>`;
  els.oneTimeBillsList.innerHTML = oneTimeBills.map(renderOneTimeBill).join("") || `<p class="empty">No one-time payments added.</p>`;
  els.transactionCount.textContent = `${visibleTransactions.length} visible`;
  els.transactionList.innerHTML = visibleTransactions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30)
    .map(renderTransaction)
    .join("") || `<p class="empty">No spending logged yet.</p>`;
  els.categoryChips.innerHTML = renderCategoryChips(periodTransactions);
  els.billForm.elements.date.value ||= toInputDate(new Date());
  els.incomeForm.elements.date.value ||= toInputDate(new Date());
  els.spendingForm.elements.date.value ||= toInputDate(new Date());
}

function listenForInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallBanner();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    localStorage.setItem(INSTALL_BANNER_KEY, "yes");
    updateInstallBanner();
  });
}

async function installApp() {
  if (!deferredInstallPrompt) {
    updateInstallBanner();
    return;
  }

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice.catch(() => null);
  deferredInstallPrompt = null;
  updateInstallBanner();
}

function updateInstallBanner() {
  if (localStorage.getItem(INSTALL_BANNER_KEY) === "yes") return;

  const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches || navigator.standalone;
  if (standalone) {
    els.installBanner.classList.add("hidden");
    return;
  }

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  els.installAppButton.classList.toggle("hidden", !deferredInstallPrompt);
  els.installHelp.textContent = deferredInstallPrompt
    ? "Tap Install to add it like an app."
    : isIos
      ? "On iPhone: tap Share, then Add to Home Screen."
      : "Open this in Chrome, then use the browser menu to add it to your home screen.";
}

function dismissInstallBanner() {
  localStorage.setItem(INSTALL_BANNER_KEY, "yes");
  render();
}

function switchTab(event) {
  const tabName = event.currentTarget.dataset.tab;
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  els.pages.forEach((page) => page.classList.toggle("active", page.dataset.page === tabName));
}

function updateBalance(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.bankBalance = Number(form.get("balance")) || 0;
  saveState();
  render();
}

function addBill(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = form.get("name").trim();
  const editId = form.get("editId");
  const repeat = normalizeRepeat(form.get("repeat"));
  const bill = {
    id: editId || crypto.randomUUID(),
    name,
    date: form.get("date"),
    amount: Number(form.get("amount")),
    note: form.get("note").trim(),
    type: form.get("type"),
    repeat,
    recurrence: repeat === "custom" ? readCustomRecurrence(form) : null,
  };
  if (editId) {
    state.bills = state.bills.map((saved) => saved.id === editId ? bill : saved);
  } else {
    state.bills.push(bill);
  }
  saveState();
  resetBillForm();
  render();
}

function handleBillPageAction(event) {
  const editButton = event.target.closest("[data-edit-bill]");
  if (editButton) {
    editBill(editButton.dataset.editBill, editButton.dataset.editDate);
    return;
  }
  deleteBill(event);
}

function editBill(billId, shownDate) {
  const bill = state.bills.find((saved) => saved.id === billId);
  if (!bill) return;
  els.billForm.elements.editId.value = bill.id;
  els.billForm.elements.name.value = bill.name;
  els.billForm.elements.date.value = shownDate || bill.date;
  els.billForm.elements.amount.value = bill.amount;
  els.billForm.elements.note.value = bill.note || "";
  els.billForm.elements.type.value = bill.type;
  els.billForm.elements.repeat.value = bill.repeat === "once" ? "none" : bill.repeat || "none";
  writeCustomRecurrence(bill);
  updateCustomRepeatVisibility();
  els.billFormTitle.textContent = "Edit bill or payment";
  els.billSubmitButton.textContent = "Save";
  els.cancelBillEditButton.classList.remove("hidden");
}

function cancelBillEdit() {
  resetBillForm();
  render();
}

function resetBillForm() {
  els.billForm.reset();
  els.billForm.elements.editId.value = "";
  clearRepeatDays();
  els.billFormTitle.textContent = "Add bill or payment";
  els.billSubmitButton.textContent = "Add";
  els.cancelBillEditButton.classList.add("hidden");
  updateCustomRepeatVisibility();
}

function updateCustomRepeatVisibility() {
  const isCustom = els.billForm.elements.repeat.value === "custom";
  const isWeeklyCustom = isCustom && els.billForm.elements.repeatUnit.value === "week";
  els.customRepeat.classList.toggle("hidden", !isCustom);
  els.weekdayPicker.classList.toggle("hidden", !isWeeklyCustom);
}

function readCustomRecurrence(form) {
  return {
    interval: Math.max(Number(form.get("repeatInterval")) || 1, 1),
    unit: form.get("repeatUnit"),
    days: form.getAll("repeatDays").map(Number),
    end: form.get("repeatEnd") === "on" ? form.get("repeatEndDate") : "",
  };
}

function writeCustomRecurrence(bill) {
  const recurrence = bill.recurrence || {};
  els.billForm.elements.repeatInterval.value = recurrence.interval || 1;
  els.billForm.elements.repeatUnit.value = recurrence.unit || "month";
  els.billForm.elements.repeatEnd.value = recurrence.end ? "on" : "never";
  els.billForm.elements.repeatEndDate.value = recurrence.end || "";
  clearRepeatDays();
  for (const day of recurrence.days || []) {
    const input = els.billForm.querySelector(`[name="repeatDays"][value="${day}"]`);
    if (input) input.checked = true;
  }
}

function clearRepeatDays() {
  els.billForm.querySelectorAll("[name='repeatDays']").forEach((input) => {
    input.checked = false;
  });
}

function normalizeRepeat(value) {
  return value === "none" ? "once" : value;
}

function addIncome(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.paychecks.push({
    id: crypto.randomUUID(),
    name: form.get("name").trim(),
    date: form.get("date"),
    amount: Number(form.get("amount")),
    repeat: form.get("repeat"),
  });
  saveState();
  event.currentTarget.reset();
  render();
}

function deleteBill(event) {
  const button = event.target.closest("[data-delete-bill]");
  if (!button) return;
  const billId = button.dataset.deleteBill;
  state.bills = state.bills.filter((bill) => bill.id !== billId);
  saveState();
  render();
}

function addManualSpending(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  addTransaction({
    date: form.get("date"),
    description: form.get("description"),
    category: form.get("category"),
    amount: Number(form.get("amount")),
    source: "manual",
  });
  event.currentTarget.reset();
  event.currentTarget.elements.date.value = toInputDate(new Date());
}

function hideTransaction(event) {
  const row = event.target.closest("[data-transaction-id]");
  if (!row) return;
  if (event.target.closest("button, select")) return;
  const hidden = hiddenTransactions();
  hidden.add(row.dataset.transactionId);
  localStorage.setItem(HIDDEN_TRANSACTIONS_KEY, JSON.stringify([...hidden]));
  queueRemoteSave();
  render();
}

function assignTransactionToBill(event) {
  const select = event.target.closest("[data-assign-transaction]");
  if (!select) return;

  const transaction = state.transactions.find((saved) => saved.id === select.dataset.assignTransaction);
  if (!transaction) return;

  if (select.value === "__spending") {
    delete transaction.billId;
    transaction.ignoreBillMatch = true;
    transaction.category = categorize(transaction.description);
  } else {
    const bill = state.bills.find((saved) => saved.id === select.value);
    if (!bill) return;
    transaction.billId = bill.id;
    delete transaction.ignoreBillMatch;
    transaction.category = "Bill";
  }

  saveState();
  render();
}

function deleteTransaction(event) {
  const button = event.target.closest("[data-delete-transaction]");
  if (!button) return;

  state.transactions = state.transactions.filter((transaction) => transaction.id !== button.dataset.deleteTransaction);
  const hidden = hiddenTransactions();
  hidden.delete(button.dataset.deleteTransaction);
  localStorage.setItem(HIDDEN_TRANSACTIONS_KEY, JSON.stringify([...hidden]));
  saveState();
  render();
}

function hiddenTransactions() {
  try {
    return new Set(JSON.parse(localStorage.getItem(HIDDEN_TRANSACTIONS_KEY)) || []);
  } catch {
    return new Set();
  }
}

async function importStatement(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const rows = await readStatementRows(file);
    const transactions = rows.map(mapBankRow).filter(Boolean);
    let added = 0;
    for (const transaction of transactions) {
      if (!state.transactions.some((saved) => saved.id === transaction.id)) {
        state.transactions.push(transaction);
        added += 1;
      }
    }
    saveState();
    render();
    els.importStatus.textContent = `Imported ${added} rows from ${file.name}. Matched bills stay out of the spending pot.`;
  } catch (error) {
    els.importStatus.textContent = `Could not import ${file.name}: ${error.message}`;
  } finally {
    event.target.value = "";
  }
}

async function readStatementRows(file) {
  if (file.name.toLowerCase().endsWith(".csv")) {
    return parseCsv(await file.text());
  }

  if (!window.XLSX) {
    throw new Error("Excel importer did not load. Try exporting as CSV.");
  }

  const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return window.XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

function mapBankRow(row) {
  const normalized = normalizeKeys(row);
  const date = normalizeDate(normalized["post date"] || normalized.date || normalized.posted);
  const description = normalized.description || normalized.name || normalized.memo;
  const debit = numberFrom(normalized.debit);
  const credit = numberFrom(normalized.credit);
  const amount = debit || 0;

  if (!date || !description || !amount || credit) return null;
  if (shouldIgnore(description, normalized.classification)) return null;

  const transaction = {
    id: `${date}-${description}-${amount}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    date,
    description: cleanDescription(description),
    category: categorize(description, normalized.classification),
    amount,
    source: "statement",
  };
  const bill = matchingBillForTransaction(transaction);
  if (bill) {
    transaction.billId = bill.id;
    transaction.category = "Bill";
  }
  return transaction;
}

function normalizeKeys(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [String(key).trim().toLowerCase(), value]));
}

function shouldIgnore(description, classification = "") {
  const value = `${description} ${classification}`.toLowerCase();
  return value.includes("round up transfer")
    || value.includes("transfer")
    || value.includes("credit card payment")
    || value.includes("utilities")
    || value.includes("bills & utilities")
    || value.includes("financial")
    || value.includes("tuition")
    || value.includes("education")
    || value.includes("doctor")
    || value.includes("pharmacy")
    || value.includes("banking fee")
    || value.includes("fees & charges")
    || value.includes("overdraft")
    || value.includes("service fee")
    || value.includes("dte energy")
    || value.includes("comcast")
    || value.includes("naterapatient")
    || value.includes("getcurex")
    || value.includes("deposit")
    || value.includes("payroll")
    || value.includes("income");
}

function categorize(description, classification = "") {
  const value = `${description} ${classification}`.toLowerCase();
  if (value.includes("kroger") || value.includes("meijer") || value.includes("trader joe") || value.includes("whole foods") || value.includes("grocer") || value.includes("supermarket")) return "Groceries";
  if (value.includes("citgo") || value.includes("exxon") || value.includes("shell") || value.includes("bp#") || value.includes("marathon") || value.includes("7-eleven") || value.includes("gas")) return "Gas";
  return "Spending";
}

function accountedBillForTransaction(transaction) {
  if (!transaction) return null;
  if (transaction.ignoreBillMatch) return null;
  if (transaction.billId) return state.bills.find((bill) => bill.id === transaction.billId) || null;
  return matchingBillForTransaction(transaction);
}

function matchingBillForTransaction(transaction) {
  const amount = Number(transaction.amount);
  const date = parseLocalDate(transaction.date);
  const start = addDays(date, -4);
  const end = addDays(date, 4);

  return expandBills(start, end)
    .filter((bill) => bill.type !== "income")
    .filter((bill) => Math.abs(Number(bill.amount) - amount) < 0.02)
    .find((bill) => transactionMatchesBillText(transaction.description, bill.name)) || null;
}

function transactionMatchesBillText(description, billName) {
  const transactionWords = searchableWords(description);
  const billWords = searchableWords(billName);
  if (!transactionWords.length || !billWords.length) return false;
  return billWords.some((word) => transactionWords.includes(word));
}

function searchableWords(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word.length >= 4);
}

function addTransaction(transaction) {
  state.transactions.push({
    id: crypto.randomUUID(),
    ...transaction,
    amount: Number(transaction.amount),
  });
  saveState();
  render();
}

function weeklyPile() {
  const period = currentSpendingPeriod();
  const spent = spendingTransactionsForRange(period.start, period.end)
    .reduce((total, transaction) => total + transaction.amount, 0)
    + plannedWeeklySpendingForRange(period.start, period.end);
  return { spent, left: Math.max(state.weeklyLimit - spent, 0) };
}

function currentWeeklyTransactions(week = currentFridayWeek()) {
  return spendingTransactionsForRange(week.start, week.end);
}

function spendingTransactionsForRange(start, end) {
  return state.transactions
    .filter((transaction) => !accountedBillForTransaction(transaction))
    .filter((transaction) => isWithin(transaction.date, start, end));
}

function plannedWeeklySpendingForRange(start, end) {
  return expandBills(start, end)
    .filter((bill) => bill.type === "weekly")
    .filter((bill) => bill.dateObj >= start && bill.dateObj <= end)
    .reduce((total, bill) => total + bill.amount, 0);
}

function currentFridayWeek() {
  return fridayWeekFor(stripTime(new Date()));
}

function currentSpendingPeriod(today = stripTime(new Date())) {
  const start = getCurrentPeriodStart(today);
  const nextGroup = groupPaychecks(generatePaychecks(start, addDays(today, 60)))
    .find((group) => group.date > start);
  return {
    start,
    end: addDays(nextGroup?.date || addDays(start, 14), -1),
  };
}

function buildPayPeriodForecast(count) {
  const today = stripTime(new Date());
  const start = getCurrentPeriodStart(today);
  const horizon = addDays(today, 140);
  const paycheckGroups = groupPaychecks(generatePaychecks(start, horizon));
  const periods = [];
  let openingBalance = state.bankBalance;
  let periodStart = start;

  for (let index = 0; index < paycheckGroups.length && periods.length < count; index += 1) {
    const group = paycheckGroups[index];
    const nextGroup = paycheckGroups[index + 1];
    const isBeforeFirstPaycheck = periods.length === 0 && periodStart < group.date;
    const end = isBeforeFirstPaycheck ? addDays(group.date, -1) : addDays(nextGroup?.date || addDays(group.date, 14), -1);
    const bills = billsForRange(periodStart, end);
    const paycheckIncome = isBeforeFirstPaycheck ? [] : group.items.filter((item) => item.dateObj > today);
    const scheduledIncome = incomeForRange(periodStart, end)
      .filter((item) => item.dateObj > today)
      .filter((item) => !paycheckIncome.some((paycheck) => isSameDate(paycheck.dateObj, item.dateObj) && paycheck.amount === item.amount));
    const income = [...paycheckIncome, ...scheduledIncome].sort((a, b) => a.dateObj - b.dateObj);
    const incomeTotal = income.reduce((total, item) => total + item.amount, 0);
    const billTotal = bills.reduce((total, bill) => total + bill.amount, 0);
    const availableAfterBills = openingBalance + incomeTotal - billTotal;
    const reserve = spendingReserveForRange(periodStart, end, today, availableAfterBills);
    const spendingReserveTotal = reserve.total;
    const leftover = openingBalance + incomeTotal - billTotal - spendingReserveTotal;

    periods.push({
      start: periodStart,
      end,
      income,
      bills,
      openingBalance,
      incomeTotal,
      billTotal,
      spendingReserveTotal,
      currentWeekReserve: reserve.currentWeek,
      futureWeekReserve: reserve.futureWeeks,
      leftover,
    });

    openingBalance = leftover;
    periodStart = isBeforeFirstPaycheck ? group.date : nextGroup?.date;
    if (!periodStart) break;
    if (isBeforeFirstPaycheck) index -= 1;
  }

  return periods;
}

function generatePaychecks(start, end) {
  return state.paychecks
    .flatMap((paycheck) => expandPaycheck(paycheck, start, end))
    .sort((a, b) => a.dateObj - b.dateObj);
}

function expandPaycheck(paycheck, start, end) {
  const repeat = paycheck.repeat || "once";
  const firstDate = parseLocalDate(paycheck.date);
  if (repeat === "once") return firstDate >= start && firstDate <= end ? [paycheckEvent(paycheck, firstDate)] : [];
  if (repeat === "biweekly") return expandBiweeklyPaycheck(paycheck, start, end);
  if (repeat === "monthly-15") return expandMonthlyPaycheck(paycheck, start, end, 15);
  if (repeat === "monthly-30") return expandMonthlyPaycheck(paycheck, start, end, 30);
  return [];
}

function expandBiweeklyPaycheck(paycheck, start, end) {
  const dates = [];
  const cursor = parseLocalDate(paycheck.date);
  while (cursor < start) cursor.setDate(cursor.getDate() + 14);
  while (cursor <= end) {
    dates.push(paycheckEvent(paycheck, cursor));
    cursor.setDate(cursor.getDate() + 14);
  }
  return dates;
}

function expandMonthlyPaycheck(paycheck, start, end, day) {
  const dates = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    const date = closestWeekday(new Date(cursor.getFullYear(), cursor.getMonth(), Math.min(day, daysInMonth(cursor))));
    if (date >= start && date <= end) dates.push(paycheckEvent(paycheck, date));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return dates;
}

function paycheckEvent(paycheck, date) {
  return {
    ...paycheck,
    date: toInputDate(date),
    dateObj: new Date(date),
  };
}

function groupPaychecks(paychecks) {
  const groups = [];
  for (const paycheck of paychecks) {
    const last = groups[groups.length - 1];
    if (last && dayDiff(last.date, paycheck.dateObj) < 6) {
      last.items.push(paycheck);
      if (paycheck.dateObj < last.date) last.date = paycheck.dateObj;
    } else {
      groups.push({ date: paycheck.dateObj, items: [paycheck] });
    }
  }
  return groups;
}

function getCurrentPeriodStart(today = stripTime(new Date())) {
  const lookback = addDays(today, -60);
  const horizon = addDays(today, 60);
  const groups = groupPaychecks(generatePaychecks(lookback, horizon));
  const currentGroup = groups
    .filter((group) => group.date <= today)
    .at(-1);
  return currentGroup?.date || today;
}

function spendingReserveForRange(start, end, today = stripTime(new Date()), available = Infinity) {
  const currentWeekRange = fridayWeekFor(today);
  let currentWeekMax = 0;
  let currentWeekPlanned = 0;
  let futurePlanned = 0;
  let weekStart = fridayWeekFor(start).start;

  while (weekStart <= end) {
    const weekEnd = addDays(weekStart, 6);
    const overlapsPeriod = weekEnd >= start && weekStart <= end;
    if (overlapsPeriod && weekEnd >= today) {
      const isCurrentWeek = isSameDate(weekStart, currentWeekRange.start);
      const planned = plannedWeeklySpendingForRange(weekStart, weekEnd);
      if (isCurrentWeek) {
        currentWeekPlanned = planned;
        currentWeekMax = weeklyPile().left;
      } else {
        futurePlanned += planned;
      }
    }
    weekStart = addDays(weekStart, 7);
  }

  const requiredPlanned = currentWeekPlanned + futurePlanned;
  const currentWeek = Math.max(Math.min(currentWeekMax, available - requiredPlanned), 0);
  const total = Math.max(Math.min(requiredPlanned + currentWeek, available), 0);

  return {
    total,
    currentWeek,
    futureWeeks: Math.min(futurePlanned, total),
  };
}

function fridayWeekFor(date) {
  const day = stripTime(date);
  const daysSinceFriday = (day.getDay() + 2) % 7;
  const start = addDays(day, -daysSinceFriday);
  return { start, end: addDays(start, 6) };
}

function billsForRange(start, end) {
  return expandBills(start, end)
    .filter((bill) => bill.type !== "weekly")
    .filter((bill) => bill.type !== "income")
    .filter((bill) => bill.dateObj >= start && bill.dateObj <= end)
    .sort((a, b) => a.dateObj - b.dateObj);
}

function incomeForRange(start, end) {
  return expandBills(start, end)
    .filter((bill) => bill.type === "income")
    .filter((bill) => bill.dateObj >= start && bill.dateObj <= end)
    .sort((a, b) => a.dateObj - b.dateObj);
}

function recurringBillSchedule() {
  return state.bills
    .filter((bill) => (bill.repeat || "once") !== "once")
    .filter((bill) => bill.type !== "income")
    .slice()
    .sort((a, b) => billDay(a) - billDay(b) || a.name.localeCompare(b.name));
}

function oneTimeBillSchedule() {
  return state.bills
    .filter((bill) => (bill.repeat || "once") === "once")
    .map((bill) => ({ ...bill, dateObj: parseLocalDate(bill.date) }))
    .sort((a, b) => a.dateObj - b.dateObj);
}

function upcoming(days) {
  const today = stripTime(new Date());
  const end = addDays(today, days);
  return expandBills(today, end)
    .filter((bill) => bill.type !== "income")
    .filter((bill) => bill.dateObj >= today && bill.dateObj <= end)
    .sort((a, b) => a.dateObj - b.dateObj);
}

function currentPayPeriod() {
  const today = stripTime(new Date());
  const start = getCurrentPeriodStart(today);
  const nextGroup = groupPaychecks(generatePaychecks(start, addDays(today, 45)))
    .map((group) => ({ ...group, items: group.items.filter((item) => item.dateObj > today) }))
    .find((group) => group.items.length);
  const nextPayDate = nextGroup?.items[0]?.dateObj;
  return {
    start: toInputDate(start),
    date: toInputDate(nextPayDate || addDays(today, 14)),
    label: nextGroup?.items.length > 1 ? "Next paycheck group" : "Next paycheck",
    dates: nextGroup?.items.map((item) => shortDate(item.dateObj)).join(" + ") || shortDate(addDays(today, 14)),
    income: nextGroup?.items.reduce((total, item) => total + item.amount, 0) || 0,
  };
}

function requiredBillsBeforePaycheck(paycheck) {
  const start = paycheck.start ? parseLocalDate(paycheck.start) : stripTime(new Date());
  const payDate = parseLocalDate(paycheck.date);
  return expandBills(start, payDate)
    .filter((bill) => bill.type !== "weekly")
    .filter((bill) => bill.type !== "income")
    .filter((bill) => bill.dateObj >= start && bill.dateObj < payDate)
    .sort((a, b) => a.dateObj - b.dateObj);
}

function expandBills(start, end) {
  return state.bills.flatMap((bill) => expandBill(bill, start, end));
}

function expandBill(bill, start, end) {
  const repeat = bill.repeat || "once";
  const firstDate = parseLocalDate(bill.date);
  if (repeat === "once") return [{ ...bill, dateObj: firstDate }];
  if (repeat === "daily") return expandEveryDays(bill, start, end, 1);
  if (repeat === "weekly") return expandEveryDays(bill, start, end, 7);
  if (repeat === "weekdays") return expandWeekdays(bill, start, end);
  if (repeat === "yearly") return expandEveryMonths(bill, start, end, 12);
  if (repeat === "custom") return expandCustomBill(bill, start, end);
  return expandEveryMonths(bill, start, end, repeat === "quarterly" ? 3 : 1);
}

function expandEveryMonths(bill, start, end, everyMonths) {
  const firstDate = parseLocalDate(bill.date);
  const until = recurrenceEnd(bill, end);
  const dates = [];
  const cursor = new Date(firstDate);
  while (cursor < start) cursor.setMonth(cursor.getMonth() + everyMonths);
  while (cursor <= end && cursor <= until) {
    dates.push({ ...bill, date: toInputDate(cursor), dateObj: new Date(cursor) });
    cursor.setMonth(cursor.getMonth() + everyMonths);
  }
  return dates;
}

function expandEveryDays(bill, start, end, everyDays) {
  const firstDate = parseLocalDate(bill.date);
  const until = recurrenceEnd(bill, end);
  const dates = [];
  const cursor = new Date(firstDate);
  while (cursor < start) cursor.setDate(cursor.getDate() + everyDays);
  while (cursor <= end && cursor <= until) {
    dates.push({ ...bill, date: toInputDate(cursor), dateObj: new Date(cursor) });
    cursor.setDate(cursor.getDate() + everyDays);
  }
  return dates;
}

function expandWeekdays(bill, start, end) {
  const firstDate = parseLocalDate(bill.date);
  const until = recurrenceEnd(bill, end);
  const dates = [];
  const cursor = new Date(Math.max(firstDate, start));
  while (cursor <= end && cursor <= until) {
    if (cursor.getDay() >= 1 && cursor.getDay() <= 5) {
      dates.push({ ...bill, date: toInputDate(cursor), dateObj: new Date(cursor) });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function expandCustomBill(bill, start, end) {
  const recurrence = bill.recurrence || {};
  const interval = Math.max(Number(recurrence.interval) || 1, 1);
  if (recurrence.unit === "day") return expandEveryDays(bill, start, end, interval);
  if (recurrence.unit === "month") return expandEveryMonths(bill, start, end, interval);
  if (recurrence.unit === "year") return expandEveryMonths(bill, start, end, interval * 12);
  return expandCustomWeeks(bill, start, end, interval, recurrence.days || []);
}

function expandCustomWeeks(bill, start, end, interval, days) {
  const firstDate = parseLocalDate(bill.date);
  const until = recurrenceEnd(bill, end);
  const repeatDays = days.length ? days : [firstDate.getDay()];
  const dates = [];
  const cursor = new Date(Math.max(firstDate, start));
  while (cursor <= end && cursor <= until) {
    const weeksSinceStart = Math.floor(dayDiff(firstDate, cursor) / 7);
    if (weeksSinceStart >= 0 && weeksSinceStart % interval === 0 && repeatDays.includes(cursor.getDay())) {
      dates.push({ ...bill, date: toInputDate(cursor), dateObj: new Date(cursor) });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function recurrenceEnd(bill, fallback) {
  return bill.recurrence?.end ? parseLocalDate(bill.recurrence.end) : fallback;
}

function renderBill(bill) {
  return `
    <article class="row">
      <div>
        <strong>${bill.name}</strong>
        <span>${shortDate(bill.dateObj)} · ${bill.type}${bill.repeat && bill.repeat !== "once" ? ` · ${bill.repeat}` : ""}${bill.note ? ` · ${escapeHtml(bill.note)}` : ""}</span>
      </div>
      <div class="row-actions">
        ${moneyHtml(-bill.amount)}
        <button class="icon-button" type="button" data-delete-bill="${bill.id}" aria-label="Delete ${escapeHtml(bill.name)}">x</button>
      </div>
    </article>
  `;
}

function renderScheduleBill(bill) {
  const day = billDay(bill);
  const repeatLabel = repeatDescription(bill);
  return `
    <article class="schedule-bill">
      <div class="day-badge">${day}</div>
      <div>
        <strong>${bill.name}</strong>
        <span>${bill.type} · ${repeatLabel}${bill.note ? ` · ${escapeHtml(bill.note)}` : ""}</span>
      </div>
      <div class="row-actions">
        ${moneyHtml(-bill.amount)}
        <button class="text-button small-button" type="button" data-edit-bill="${bill.id}">Edit</button>
        <button class="icon-button" type="button" data-delete-bill="${bill.id}" aria-label="Delete ${escapeHtml(bill.name)}">x</button>
      </div>
    </article>
  `;
}

function repeatDescription(bill) {
  if (bill.repeat === "daily") return "daily";
  if (bill.repeat === "weekly") return "weekly";
  if (bill.repeat === "quarterly") return "every 3 months";
  if (bill.repeat === "yearly") return "annually";
  if (bill.repeat === "weekdays") return "every weekday";
  if (bill.repeat === "custom") return customRepeatDescription(bill.recurrence);
  return "monthly";
}

function customRepeatDescription(recurrence = {}) {
  const interval = Math.max(Number(recurrence.interval) || 1, 1);
  const unit = recurrence.unit || "month";
  const plural = interval === 1 ? unit : `${unit}s`;
  const end = recurrence.end ? ` until ${shortDate(parseLocalDate(recurrence.end))}` : "";
  return `every ${interval} ${plural}${end}`;
}

function renderOneTimeBill(bill) {
  return `
    <article class="row monthly-row">
      <div>
        <strong>${bill.name}</strong>
        <span>${shortDate(bill.dateObj)} · one time · ${bill.type}${bill.note ? ` · ${escapeHtml(bill.note)}` : ""}</span>
      </div>
      <div class="row-actions">
        ${moneyHtml(bill.type === "income" ? bill.amount : -bill.amount)}
        <button class="text-button small-button" type="button" data-edit-bill="${bill.id}" data-edit-date="${bill.date}">Edit</button>
        <button class="icon-button" type="button" data-delete-bill="${bill.id}" aria-label="Delete ${escapeHtml(bill.name)}">x</button>
      </div>
    </article>
  `;
}

function renderPayPeriod(period, index) {
  const title = index === 0 ? "Now" : shortDate(period.start);
  const incomeText = period.income.length
    ? period.income.map((item) => `${escapeHtml(item.name)} ${moneyHtml(item.amount)}`).join(", ")
    : "No paycheck in this short period";
  const incomeDetails = period.income.length
    ? period.income.map((item) => renderForecastDetail(item.name, item.dateObj, item.amount)).join("")
    : `<p class="empty">No income in this period.</p>`;
  const billDetails = period.bills.length
    ? period.bills.map((bill) => renderForecastDetail(bill.name, bill.dateObj, -bill.amount)).join("")
    : `<p class="empty">No bills in this period.</p>`;

  return `
    <details class="period-card" ${index === 0 ? "open" : ""}>
      <summary class="period-title">
        <span>
          <strong>${title} - ${shortDate(period.end)}</strong>
          <em>${incomeText}</em>
        </span>
        <b class="period-leftover ${moneyClass(period.leftover)}">${money(period.leftover)}</b>
      </summary>
      <div class="period-money">
        <div><span>Start</span><b class="${moneyClass(period.openingBalance)}">${money(period.openingBalance)}</b></div>
        <div><span>Paychecks</span><b class="${moneyClass(period.incomeTotal)}">${money(period.incomeTotal)}</b></div>
        <div><span>Bills</span><b class="${moneyClass(-period.billTotal)}">${money(-period.billTotal)}</b></div>
        <div><span>Period pot</span><b class="${moneyClass(-period.spendingReserveTotal)}">${money(-period.spendingReserveTotal)}</b></div>
        <div><span>Leftover</span><b class="${moneyClass(period.leftover)}">${money(period.leftover)}</b></div>
      </div>
      <div class="period-details">
        <div>
          <h4>Income</h4>
          <div class="list">${incomeDetails}</div>
        </div>
        <div>
          <h4>Bills</h4>
          <div class="list">${billDetails}</div>
        </div>
      </div>
    </details>
  `;
}

function renderForecastDetail(name, date, amount) {
  return `
    <article class="row compact-row">
      <div>
        <strong>${escapeHtml(name)}</strong>
        <span>${shortDate(date)}</span>
      </div>
      ${moneyHtml(amount)}
    </article>
  `;
}

function renderTransaction(transaction) {
  const bill = accountedBillForTransaction(transaction);
  const label = bill ? `Bill · ${bill.name}` : transaction.category;
  return `
    <article class="row" data-transaction-id="${escapeHtml(transaction.id)}">
      <div>
        <strong>${transaction.description}</strong>
        <span>${shortDate(parseLocalDate(transaction.date))} · ${escapeHtml(label)}</span>
      </div>
      <div class="row-actions transaction-actions">
        <select class="mini-select" data-assign-transaction="${escapeHtml(transaction.id)}" aria-label="Assign ${escapeHtml(transaction.description)} to a bill">
          ${renderBillAssignmentOptions(bill)}
        </select>
        ${moneyHtml(-transaction.amount)}
        <button class="icon-button" type="button" data-delete-transaction="${escapeHtml(transaction.id)}" aria-label="Delete ${escapeHtml(transaction.description)}">x</button>
      </div>
    </article>
  `;
}

function renderBillAssignmentOptions(selectedBill) {
  const billOptions = state.bills
    .filter((bill) => bill.type !== "income")
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((bill) => `<option value="${escapeHtml(bill.id)}" ${selectedBill?.id === bill.id ? "selected" : ""}>${escapeHtml(bill.name)}</option>`)
    .join("");

  return `
    <option value="__spending" ${selectedBill ? "" : "selected"}>Spending pot</option>
    <option disabled>Assign to bill...</option>
    ${billOptions}
  `;
}

function renderCategoryChips(transactions) {
  const totals = { Groceries: 0, Gas: 0, Spending: 0 };
  for (const transaction of transactions) totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
  return Object.entries(totals).map(([name, total]) => `<span>${name}: ${moneyHtml(-total)}</span>`).join("");
}

function renderCategoryCards(transactions) {
  const totals = categoryTotals(transactions);
  return ["Groceries", "Gas", "Spending"].map((name) => {
    const spent = totals[name] || 0;
    const percent = Math.min((spent / state.weeklyLimit) * 100, 100);
    return `
      <article class="category-card">
        <div>
          <span>${name}</span>
          <strong class="${moneyClass(-spent)}">${money(-spent)}</strong>
        </div>
        <div class="mini-meter"><span style="width: ${percent}%"></span></div>
      </article>
    `;
  }).join("");
}

function allocatePot(total, transactions = []) {
  const spent = categoryTotals(transactions);
  const groceriesBudget = Math.min(200, total);
  const gasBudget = Math.min(40, Math.max(total - groceriesBudget, 0));
  const baseSpendingBudget = Math.max(total - groceriesBudget - gasBudget, 0);
  const groceriesOver = Math.max((spent.Groceries || 0) - groceriesBudget, 0);
  const gasOver = Math.max((spent.Gas || 0) - gasBudget, 0);
  const spendingBudget = Math.max(baseSpendingBudget - groceriesOver - gasOver, 0);
  const denominator = total || 1;

  return {
    groceriesLabel: `${money(spent.Groceries || 0)} / ${money(groceriesBudget)}`,
    gasLabel: `${money(spent.Gas || 0)} / ${money(gasBudget)}`,
    spendingLabel: `${money(spent.Spending || 0)} / ${money(spendingBudget)}`,
    groceriesPercent: roundMoney((groceriesBudget / denominator) * 100),
    gasPercent: roundMoney((gasBudget / denominator) * 100),
    spendingPercent: roundMoney((spendingBudget / denominator) * 100),
  };
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function categoryTotals(transactions) {
  const totals = { Groceries: 0, Gas: 0, Spending: 0 };
  for (const transaction of transactions) totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
  return totals;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = splitCsv(lines[0]);
  return lines.slice(1).map((line) => Object.fromEntries(splitCsv(line).map((value, index) => [headers[index], value])));
}

function splitCsv(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") quoted = !quoted;
    else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else current += char;
  }
  values.push(current.trim());
  return values;
}

function cleanDescription(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function numberFrom(value) {
  if (typeof value === "number") return value;
  const clean = String(value || "").replace(/[$,()]/g, "").trim();
  return Number(clean) || 0;
}

function normalizeDate(value) {
  if (value instanceof Date) return toInputDate(value);
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? "" : toInputDate(parsed);
}

function parseLocalDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isWithin(value, start, end) {
  const date = parseLocalDate(value);
  return date >= start && date <= end;
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dayDiff(start, end) {
  return Math.round((stripTime(end) - stripTime(start)) / 86400000);
}

function isSameDate(first, second) {
  return toInputDate(first) === toInputDate(second);
}

function billDay(bill) {
  return parseLocalDate(bill.date).getDate();
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function closestWeekday(date) {
  const day = date.getDay();
  if (day === 6) return addDays(date, -1);
  if (day === 0) return addDays(date, 1);
  return date;
}

function toInputDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shortDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function moneyClass(value) {
  if (value < 0) return "money-negative";
  if (value > 0) return "money-positive";
  return "money-zero";
}

function moneyHtml(value) {
  return `<span class="${moneyClass(value)}">${money(value)}</span>`;
}

function setMoney(element, value) {
  element.textContent = money(value);
  element.classList.remove("money-positive", "money-negative", "money-zero", "danger");
  element.classList.add(moneyClass(value));
}

function resetApp() {
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(sheetSeed);
  saveState();
  render();
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
    navigator.serviceWorker.register("./service-worker.js?v=30").catch(() => {});
  }
}
