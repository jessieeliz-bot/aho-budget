const STORAGE_KEY = "money-party-v1";

const sheetSeed = {
  weeklyLimit: 500,
  bankBalance: 3799,
  rollover: 4021.65,
  savingsGoal: 7400,
  currentSavings: 6850,
  debtTarget: "Debt paid off by 2030",
  bills: [
    { name: "Affirm MR", date: "2026-06-24", amount: 22.3, type: "debt" },
    { name: "Spotify", date: "2026-06-25", amount: 16.99, type: "bill" },
    { name: "Groceries & Gas", date: "2026-06-25", amount: 150, type: "weekly" },
    { name: "Medical Payment", date: "2026-06-26", amount: 200, type: "bill" },
    { name: "One Main", date: "2026-06-26", amount: 166, type: "debt" },
    { name: "Chase CC", date: "2026-06-28", amount: 177, type: "debt" },
    { name: "Level Credit", date: "2026-06-30", amount: 6.95, type: "bill" },
    { name: "Apple CC", date: "2026-06-30", amount: 39, type: "debt" },
    { name: "Rent", date: "2026-07-01", amount: 1350, type: "bill" },
    { name: "ENT Payment", date: "2026-07-01", amount: 50, type: "bill" },
    { name: "Ceramics School", date: "2026-07-01", amount: 125, type: "bill" },
  ],
  transactions: [],
};

let state = loadState();

const els = {
  answerText: document.querySelector("#answerText"),
  answerDetail: document.querySelector("#answerDetail"),
  askForm: document.querySelector("#askForm"),
  pileLeft: document.querySelector("#pileLeft"),
  pileSpent: document.querySelector("#pileSpent"),
  pileLimit: document.querySelector("#pileLimit"),
  pileMeter: document.querySelector("#pileMeter"),
  weekRange: document.querySelector("#weekRange"),
  bankBalance: document.querySelector("#bankBalance"),
  nextBillsTotal: document.querySelector("#nextBillsTotal"),
  rollover: document.querySelector("#rollover"),
  billsCount: document.querySelector("#billsCount"),
  billsList: document.querySelector("#billsList"),
  babyGoal: document.querySelector("#babyGoal"),
  currentSavings: document.querySelector("#currentSavings"),
  debtTarget: document.querySelector("#debtTarget"),
  spendingForm: document.querySelector("#spendingForm"),
  statementFile: document.querySelector("#statementFile"),
  importStatus: document.querySelector("#importStatus"),
  transactionCount: document.querySelector("#transactionCount"),
  transactionList: document.querySelector("#transactionList"),
  categoryChips: document.querySelector("#categoryChips"),
  resetDemoButton: document.querySelector("#resetDemoButton"),
};

els.askForm.addEventListener("submit", answerQuestion);
els.spendingForm.addEventListener("submit", addManualSpending);
els.statementFile.addEventListener("change", importStatement);
els.resetDemoButton.addEventListener("click", resetApp);

registerServiceWorker();
render();

function loadState() {
  try {
    return { ...sheetSeed, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return structuredClone(sheetSeed);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  const week = currentFridayWeek();
  const weeklyTransactions = state.transactions.filter((transaction) => isWithin(transaction.date, week.start, week.end));
  const spent = weeklyTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  const left = Math.max(state.weeklyLimit - spent, 0);
  const percent = Math.min((spent / state.weeklyLimit) * 100, 100);
  const upcomingBills = upcoming(14);
  const nextBillsTotal = upcomingBills.reduce((total, bill) => total + bill.amount, 0);

  els.pileLeft.textContent = money(left);
  els.pileSpent.textContent = money(spent);
  els.pileLimit.textContent = money(state.weeklyLimit);
  els.pileMeter.style.width = `${percent}%`;
  els.weekRange.textContent = `${shortDate(week.start)} - ${shortDate(week.end)}`;
  els.bankBalance.textContent = money(state.bankBalance);
  els.nextBillsTotal.textContent = money(nextBillsTotal);
  els.rollover.textContent = money(state.rollover);
  els.babyGoal.textContent = money(state.savingsGoal);
  els.currentSavings.textContent = money(state.currentSavings);
  els.debtTarget.textContent = state.debtTarget;
  els.billsCount.textContent = `${upcomingBills.length} upcoming`;
  els.billsList.innerHTML = upcomingBills.map(renderBill).join("");
  els.transactionCount.textContent = `${state.transactions.length} logged`;
  els.transactionList.innerHTML = state.transactions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30)
    .map(renderTransaction)
    .join("") || `<p class="empty">No spending logged yet.</p>`;
  els.categoryChips.innerHTML = renderCategoryChips(weeklyTransactions);
  els.spendingForm.elements.date.value ||= toInputDate(new Date());
}

function answerQuestion(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const amount = Number(form.get("amount"));
  const thing = form.get("thing")?.trim();
  const { left } = weeklyPile();
  const after = left - amount;

  if (after >= 100) {
    els.answerText.textContent = "Yes. You have room.";
    els.answerDetail.textContent = `${money(after)} would still be left${thing ? ` after ${thing}` : ""}.`;
  } else if (after >= 0) {
    els.answerText.textContent = "Yes, but it makes the week tight.";
    els.answerDetail.textContent = `${money(after)} would be left until Friday.`;
  } else {
    els.answerText.textContent = "Not from the weekly pile.";
    els.answerDetail.textContent = `That would put you ${money(Math.abs(after))} over.`;
  }
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
    els.importStatus.textContent = `Imported ${added} new spending rows from ${file.name}.`;
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

  return {
    id: `${date}-${description}-${amount}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    date,
    description: cleanDescription(description),
    category: categorize(description, normalized.classification),
    amount,
    source: "statement",
  };
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
  if (value.includes("kroger") || value.includes("meijer") || value.includes("trader joe") || value.includes("whole foods") || value.includes("grocer")) return "Groceries";
  if (value.includes("citgo") || value.includes("exxon") || value.includes("7-eleven") || value.includes("gas")) return "Gas";
  return "Spending";
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
  const week = currentFridayWeek();
  const spent = state.transactions
    .filter((transaction) => isWithin(transaction.date, week.start, week.end))
    .reduce((total, transaction) => total + transaction.amount, 0);
  return { spent, left: Math.max(state.weeklyLimit - spent, 0) };
}

function currentFridayWeek() {
  const today = stripTime(new Date());
  const daysSinceFriday = (today.getDay() + 2) % 7;
  const start = addDays(today, -daysSinceFriday);
  return { start, end: addDays(start, 6) };
}

function upcoming(days) {
  const today = stripTime(new Date());
  const end = addDays(today, days);
  return state.bills
    .map((bill) => ({ ...bill, dateObj: parseLocalDate(bill.date) }))
    .filter((bill) => bill.dateObj >= today && bill.dateObj <= end)
    .sort((a, b) => a.dateObj - b.dateObj);
}

function renderBill(bill) {
  return `
    <article class="row">
      <div>
        <strong>${bill.name}</strong>
        <span>${shortDate(bill.dateObj)} · ${bill.type}</span>
      </div>
      <b>${money(bill.amount)}</b>
    </article>
  `;
}

function renderTransaction(transaction) {
  return `
    <article class="row">
      <div>
        <strong>${transaction.description}</strong>
        <span>${shortDate(parseLocalDate(transaction.date))} · ${transaction.category}</span>
      </div>
      <b>${money(transaction.amount)}</b>
    </article>
  `;
}

function renderCategoryChips(transactions) {
  const totals = { Groceries: 0, Gas: 0, Spending: 0 };
  for (const transaction of transactions) totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
  return Object.entries(totals).map(([name, total]) => `<span>${name}: ${money(total)}</span>`).join("");
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

function toInputDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shortDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function resetApp() {
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(sheetSeed);
  render();
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
}
