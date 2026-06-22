const STORAGE_KEY = "aho-budget-v1";

const seedBudget = {
  selectedMonth: "2026-07",
  weeklyAllowance: 300,
  currentBillsAccount: 600,
  categories: [
    { name: "Groceries", weeklyLimit: 130 },
    { name: "Gas", weeklyLimit: 70 },
    { name: "Eating Out", weeklyLimit: 45 },
    { name: "Household", weeklyLimit: 30 },
    { name: "Personal", weeklyLimit: 25 },
  ],
  recurring: [
    { name: "Rent", day: 1, amount: -1000, type: "bill" },
    { name: "Groc/Gas/Spending", day: 1, amount: -500, type: "spending-transfer" },
    { name: "Capital One", day: 3, amount: -27, type: "bill" },
    { name: "Car Insurance", day: 3, amount: -208.8, type: "bill" },
    { name: "Moped", day: 3, amount: -100.37, type: "bill" },
    { name: "Klarna MR", day: 5, amount: -27.81, type: "bill" },
    { name: "Ceramics School", day: 8, amount: -125, type: "bill" },
    { name: "Groc/Gas/Spending", day: 8, amount: -500, type: "spending-transfer" },
    { name: "KittyPoo", day: 9, amount: -24.48, type: "bill" },
    { name: "Natera", day: 11, amount: -47.79, type: "bill" },
    { name: "BofA CC", day: 12, amount: -67, type: "debt" },
    { name: "One Main", day: 12, amount: -165, type: "debt" },
    { name: "Affirm DW", day: 14, amount: -20.99, type: "debt" },
    { name: "Capital One CC", day: 15, amount: -25, type: "debt" },
    { name: "Quicksilver CC", day: 15, amount: -27, type: "debt" },
    { name: "Apple CC", day: 15, amount: -42, type: "debt" },
    { name: "Groc/Gas/Spending", day: 15, amount: -500, type: "spending-transfer" },
    { name: "Settlement", day: 16, amount: -309.77, type: "debt" },
    { name: "Affirm DTE1", day: 17, amount: -24.51, type: "debt" },
    { name: "DTE", day: 18, amount: -200, type: "bill" },
    { name: "Affirm AC", day: 19, amount: -61.22, type: "debt" },
    { name: "Curex", day: 20, amount: -59, type: "bill" },
    { name: "Discover CC", day: 21, amount: -35, type: "debt" },
    { name: "Lemonade", day: 21, amount: -100, type: "bill" },
    { name: "Xfinity", day: 22, amount: -65, type: "bill" },
    { name: "Groc/Gas/Spending", day: 22, amount: -500, type: "spending-transfer" },
    { name: "Affirm MR", day: 23, amount: -22.3, type: "debt" },
    { name: "Netflix", day: 23, amount: -7.99, type: "bill" },
    { name: "Spotify", day: 25, amount: -18.99, type: "bill" },
    { name: "One Main", day: 26, amount: -166, type: "debt" },
    { name: "Chase CC", day: 28, amount: -140, type: "debt" },
    { name: "Level Credit", day: 31, amount: -6.95, type: "bill" },
  ],
  plannedEvents: [
    { date: "2026-07-01", name: "Paycheck", amount: 1700, type: "income" },
    { date: "2026-07-03", name: "Albert", amount: -300, type: "savings" },
    { date: "2026-07-04", name: "Dave", amount: -515, type: "savings" },
    { date: "2026-07-10", name: "Paycheck", amount: 1690, type: "income" },
    { date: "2026-07-11", name: "Dad", amount: -1200, type: "special" },
    { date: "2026-07-15", name: "Loan", amount: -120, type: "debt" },
    { date: "2026-07-15", name: "Paycheck", amount: 1700, type: "income" },
    { date: "2026-07-16", name: "Tuition", amount: -2260, type: "school" },
    { date: "2026-07-17", name: "Summer Estimate", amount: 2520, type: "income" },
    { date: "2026-07-25", name: "Paycheck", amount: 1690, type: "income" },
    { date: "2026-07-31", name: "Paycheck", amount: 1700, type: "income" },
  ],
  transactions: [
    { id: crypto.randomUUID(), date: "2026-07-01", description: "Groceries", category: "Groceries", amount: 84.42 },
    { id: crypto.randomUUID(), date: "2026-07-02", description: "Gas", category: "Gas", amount: 41.2 },
    { id: crypto.randomUUID(), date: "2026-07-04", description: "Dinner", category: "Eating Out", amount: 36.18 },
  ],
};

let state = loadState();

const els = {
  monthLabel: document.querySelector("#monthLabel"),
  viewTitle: document.querySelector("#viewTitle"),
  safeToSpend: document.querySelector("#safeToSpend"),
  safeToSpendCaption: document.querySelector("#safeToSpendCaption"),
  spendingMeter: document.querySelector("#spendingMeter"),
  monthEndBalance: document.querySelector("#monthEndBalance"),
  upcomingBills: document.querySelector("#upcomingBills"),
  incomeLeft: document.querySelector("#incomeLeft"),
  nextSevenList: document.querySelector("#nextSevenList"),
  nextSevenCount: document.querySelector("#nextSevenCount"),
  recentTransactions: document.querySelector("#recentTransactions"),
  recentSpendTotal: document.querySelector("#recentSpendTotal"),
  calendarSummary: document.querySelector("#calendarSummary"),
  calendarGrid: document.querySelector("#calendarGrid"),
  categoryBars: document.querySelector("#categoryBars"),
  allTransactions: document.querySelector("#allTransactions"),
  weekRange: document.querySelector("#weekRange"),
  categorySelect: document.querySelector("#categorySelect"),
  planGrid: document.querySelector("#planGrid"),
  transactionForm: document.querySelector("#transactionForm"),
  addTransactionButton: document.querySelector("#addTransactionButton"),
  connectBankButton: document.querySelector("#connectBankButton"),
  syncBankButton: document.querySelector("#syncBankButton"),
  bankSyncStatus: document.querySelector("#bankSyncStatus"),
  transactionDialog: document.querySelector("#transactionDialog"),
  dialogMount: document.querySelector("#dialogMount"),
};

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.querySelector("#prevMonth").addEventListener("click", () => changeMonth(-1));
document.querySelector("#nextMonth").addEventListener("click", () => changeMonth(1));
els.addTransactionButton.addEventListener("click", () => setView("spending"));
els.connectBankButton.addEventListener("click", connectBank);
els.syncBankButton.addEventListener("click", syncBankTransactions);
els.transactionForm.addEventListener("submit", saveTransaction);

render();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(seedBudget);

  try {
    return { ...structuredClone(seedBudget), ...JSON.parse(saved) };
  } catch {
    return structuredClone(seedBudget);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  const monthDate = parseMonth(state.selectedMonth);
  const monthName = monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  els.monthLabel.textContent = monthName;

  populateCategories();
  renderHome();
  renderCalendar();
  renderSpending();
  renderPlan();
}

function setView(view) {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === `${view}View`);
  });

  const titles = {
    home: "Today",
    calendar: "Cashflow",
    spending: "Spending",
    settings: "Plan",
  };
  els.viewTitle.textContent = titles[view];
}

function changeMonth(offset) {
  const date = parseMonth(state.selectedMonth);
  date.setMonth(date.getMonth() + offset);
  state.selectedMonth = toMonthKey(date);
  persist();
  render();
}

function renderHome() {
  const week = getCurrentWeekRange();
  const weeklySpent = sumTransactions(week.start, week.end);
  const safe = Math.max(state.weeklyAllowance - weeklySpent, 0);
  const spentPercent = Math.min((weeklySpent / state.weeklyAllowance) * 100, 100);
  const monthEvents = getMonthEvents();
  const today = getReferenceDate();
  const nextWeek = addDays(today, 7);
  const nextSevenEvents = monthEvents.filter((event) => event.date >= today && event.date <= nextWeek);
  const upcomingBillTotal = nextSevenEvents
    .filter((event) => event.amount < 0)
    .reduce((total, event) => total + Math.abs(event.amount), 0);
  const incomeLeft = monthEvents
    .filter((event) => event.amount > 0 && event.date >= today)
    .reduce((total, event) => total + event.amount, 0);
  const monthEnd = monthEvents.reduce((total, event) => total + event.amount, state.currentBillsAccount);

  els.safeToSpend.textContent = money(safe);
  els.safeToSpendCaption.textContent = `${money(weeklySpent)} spent of ${money(state.weeklyAllowance)} weekly spending money.`;
  document.querySelector(".meter").style.background =
    `conic-gradient(var(--accent) ${spentPercent * 3.6}deg, var(--accent-soft) 0deg)`;
  els.monthEndBalance.textContent = money(monthEnd);
  els.upcomingBills.textContent = money(upcomingBillTotal);
  els.incomeLeft.textContent = money(incomeLeft);
  els.nextSevenCount.textContent = `${nextSevenEvents.length} items`;
  els.recentSpendTotal.textContent = `${money(weeklySpent)} this week`;
  els.nextSevenList.innerHTML = nextSevenEvents.length
    ? nextSevenEvents.map(renderEventItem).join("")
    : `<div class="empty-state">Nothing scheduled in the next seven days.</div>`;

  const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  els.recentTransactions.innerHTML = recent.length
    ? recent.map(renderTransactionItem).join("")
    : `<div class="empty-state">No spending entered yet.</div>`;
}

function renderCalendar() {
  const events = getMonthEvents();
  const date = parseMonth(state.selectedMonth);
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const byDay = new Map();
  events.forEach((event) => {
    const day = event.date.getDate();
    byDay.set(day, [...(byDay.get(day) || []), event]);
  });

  const income = events.filter((event) => event.amount > 0).reduce((sum, event) => sum + event.amount, 0);
  const outgoing = Math.abs(events.filter((event) => event.amount < 0).reduce((sum, event) => sum + event.amount, 0));
  els.calendarSummary.textContent = `${money(income)} in, ${money(outgoing)} out`;

  els.calendarGrid.innerHTML = Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    const dateForDay = new Date(year, month, day);
    const dayEvents = byDay.get(day) || [];
    const isToday = dateForDay.toDateString() === new Date().toDateString();
    return `
      <article class="day-card ${isToday ? "today" : ""}">
        <div class="day-header">
          <span>${dateForDay.toLocaleDateString("en-US", { weekday: "short" })}</span>
          <span>${day}</span>
        </div>
        <div class="day-events">
          ${dayEvents.map(renderSmallEvent).join("") || `<span class="item-meta">No items</span>`}
        </div>
      </article>
    `;
  }).join("");
}

function renderSpending() {
  const week = getCurrentWeekRange();
  const byCategory = state.categories.map((category) => {
    const spent = state.transactions
      .filter((transaction) => transaction.category === category.name && isWithin(transaction.date, week.start, week.end))
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    return { ...category, spent };
  });

  els.weekRange.textContent = `${formatShortDate(week.start)} - ${formatShortDate(week.end)}`;
  els.categoryBars.innerHTML = byCategory.map((category) => {
    const percent = Math.min((category.spent / category.weeklyLimit) * 100, 100);
    return `
      <div class="category-row">
        <header>
          <strong>${category.name}</strong>
          <span>${money(category.spent)} / ${money(category.weeklyLimit)}</span>
        </header>
        <div class="bar"><span style="width:${percent}%"></span></div>
      </div>
    `;
  }).join("");

  const transactions = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date));
  els.allTransactions.innerHTML = transactions.length
    ? transactions.map(renderTransactionItem).join("")
    : `<div class="empty-state">Spending you add will show up here.</div>`;
}

function renderPlan() {
  els.planGrid.innerHTML = state.recurring.map((item) => `
    <article class="plan-item">
      <div>
        <div class="item-name">${item.name}</div>
        <div class="item-meta">Day ${item.day} · ${titleCase(item.type)}</div>
      </div>
      <div class="amount ${item.amount > 0 ? "income" : "bill"}">${money(item.amount)}</div>
    </article>
  `).join("");
}

function populateCategories() {
  els.categorySelect.innerHTML = state.categories
    .map((category) => `<option value="${category.name}">${category.name}</option>`)
    .join("");
  els.transactionForm.elements.date.value ||= toDateInputValue(getReferenceDate());
}

function saveTransaction(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.transactions.push({
    id: crypto.randomUUID(),
    date: form.get("date"),
    description: form.get("description").trim(),
    category: form.get("category"),
    amount: Number(form.get("amount")),
  });
  event.currentTarget.reset();
  event.currentTarget.elements.date.value = toDateInputValue(getReferenceDate());
  persist();
  render();
}

async function connectBank() {
  if (!window.Plaid) {
    setBankStatus("Plaid Link did not load. Check your internet connection and try again.");
    return;
  }

  try {
    setBankStatus("Creating a secure Plaid Link session...");
    const response = await fetch("/api/create_link_token", { method: "POST" });
    if (!response.ok) throw new Error("Could not create a link token");

    const { link_token } = await response.json();
    const handler = window.Plaid.create({
      token: link_token,
      onSuccess: async (public_token) => {
        setBankStatus("Bank connected. Saving the connection...");
        const exchange = await fetch("/api/exchange_public_token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_token }),
        });
        if (!exchange.ok) throw new Error("Could not exchange public token");
        setView("spending");
        setBankStatus("Bank connected. Syncing transactions...");
        await syncBankTransactions();
      },
      onExit: (error) => {
        setBankStatus(error ? `Plaid exited: ${error.error_message}` : "Plaid connection closed.");
      },
    });
    handler.open();
  } catch (error) {
    setBankStatus(`${error.message}. Run the Node server and check Plaid credentials.`);
  }
}

async function syncBankTransactions() {
  try {
    setBankStatus("Syncing bank transactions...");
    const response = await fetch("/api/sync_transactions", { method: "POST" });
    if (!response.ok) throw new Error("Could not sync transactions");
    const { transactions } = await response.json();
    const imported = transactions
      .filter((transaction) => transaction.amount > 0)
      .map((transaction) => ({
        id: `plaid-${transaction.id}`,
        date: transaction.date,
        description: transaction.merchant || transaction.name,
        category: mapPlaidCategory(transaction.category),
        amount: Number(transaction.amount.toFixed(2)),
        source: "plaid",
      }))
      .filter((transaction) => !state.transactions.some((saved) => saved.id === transaction.id));

    state.transactions.push(...imported);
    persist();
    render();
    setBankStatus(`Imported ${imported.length} new spending transactions.`);
  } catch (error) {
    setBankStatus(`${error.message}. Bank sync needs the local Node server.`);
  }
}

function setBankStatus(message) {
  els.bankSyncStatus.textContent = message;
}

function mapPlaidCategory(category) {
  const value = (category || "").toLowerCase();
  if (value.includes("restaurant")) return "Eating Out";
  if (value.includes("food") || value.includes("general_merchandise")) return "Groceries";
  if (value.includes("transportation") || value.includes("gas")) return "Gas";
  if (value.includes("home")) return "Household";
  return "Personal";
}

function getMonthEvents() {
  const monthDate = parseMonth(state.selectedMonth);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const recurring = state.recurring
    .filter((item) => item.day <= daysInMonth)
    .map((item) => ({
      ...item,
      date: new Date(year, month, item.day),
    }));

  const planned = state.plannedEvents
    .filter((event) => event.date.startsWith(state.selectedMonth))
    .map((event) => ({ ...event, date: parseDate(event.date) }));

  return [...recurring, ...planned].sort((a, b) => a.date - b.date || b.amount - a.amount);
}

function getCurrentWeekRange() {
  const reference = getReferenceDate();
  const day = reference.getDay();
  const start = addDays(reference, -day);
  const end = addDays(start, 6);
  return { start, end };
}

function getReferenceDate() {
  const today = new Date();
  const selected = parseMonth(state.selectedMonth);
  if (today.getFullYear() === selected.getFullYear() && today.getMonth() === selected.getMonth()) {
    return stripTime(today);
  }
  return selected;
}

function sumTransactions(start, end) {
  return state.transactions
    .filter((transaction) => isWithin(transaction.date, start, end))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

function renderEventItem(event) {
  return `
    <article class="event-item">
      <div>
        <div class="item-name">${event.name}</div>
        <div class="item-meta">${formatLongDate(event.date)} · ${titleCase(event.type)}</div>
      </div>
      <div class="amount ${event.amount > 0 ? "income" : "bill"}">${money(event.amount)}</div>
    </article>
  `;
}

function renderSmallEvent(event) {
  return `
    <div class="day-event">
      <span>${event.name}</span>
      <strong class="${event.amount > 0 ? "income" : "bill"}">${money(event.amount)}</strong>
    </div>
  `;
}

function renderTransactionItem(transaction) {
  return `
    <article class="transaction-item">
      <div>
        <div class="item-name">${transaction.description}</div>
        <div class="item-meta">${formatShortDate(parseDate(transaction.date))} · ${transaction.category}</div>
      </div>
      <div class="amount spend">-${money(transaction.amount)}</div>
    </article>
  `;
}

function parseMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function toMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isWithin(value, start, end) {
  const date = typeof value === "string" ? parseDate(value) : value;
  return date >= stripTime(start) && date <= stripTime(end);
}

function money(value) {
  const sign = value < 0 ? "-" : "";
  return `${sign}${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value))}`;
}

function formatShortDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatLongDate(date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function titleCase(value) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
