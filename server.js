import "dotenv/config";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
} from "plaid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 5173);
const dataPath = path.join(__dirname, ".data", "plaid.json");

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  }),
);

app.use(express.json());
app.use(express.static(__dirname));

app.post("/api/create_link_token", async (_request, response, next) => {
  try {
    requirePlaidConfig();
    const plaidResponse = await plaidClient.linkTokenCreate({
      user: { client_user_id: process.env.PLAID_CLIENT_USER_ID || "aho-household" },
      client_name: "Aho Budget",
      products: [Products.Transactions, Products.Liabilities],
      country_codes: [CountryCode.Us],
      language: "en",
      transactions: { days_requested: 180 },
      webhook: process.env.PLAID_WEBHOOK_URL || undefined,
    });
    response.json({ link_token: plaidResponse.data.link_token });
  } catch (error) {
    next(error);
  }
});

app.post("/api/exchange_public_token", async (request, response, next) => {
  try {
    requirePlaidConfig();
    const { public_token } = request.body;
    if (!public_token) {
      response.status(400).json({ error: "Missing public_token" });
      return;
    }

    const plaidResponse = await plaidClient.itemPublicTokenExchange({ public_token });
    const store = await readStore();
    store.items.push({
      access_token: plaidResponse.data.access_token,
      item_id: plaidResponse.data.item_id,
      cursor: null,
      connected_at: new Date().toISOString(),
    });
    await writeStore(store);
    response.json({ item_id: plaidResponse.data.item_id });
  } catch (error) {
    next(error);
  }
});

app.post("/api/sync_transactions", async (_request, response, next) => {
  try {
    requirePlaidConfig();
    const store = await readStore();
    const transactions = [];

    for (const item of store.items) {
      let cursor = item.cursor;
      let hasMore = true;

      while (hasMore) {
        const plaidResponse = await plaidClient.transactionsSync({
          access_token: item.access_token,
          cursor,
          count: 500,
        });
        const data = plaidResponse.data;
        transactions.push(
          ...data.added.map(normalizePlaidTransaction),
          ...data.modified.map(normalizePlaidTransaction),
        );
        cursor = data.next_cursor;
        hasMore = data.has_more;
      }

      item.cursor = cursor;
    }

    await writeStore(store);
    response.json({ transactions });
  } catch (error) {
    next(error);
  }
});

app.post("/api/financial_snapshot", async (_request, response, next) => {
  try {
    requirePlaidConfig();
    const store = await readStore();
    const accounts = [];
    const liabilities = [];
    const errors = [];

    for (const item of store.items) {
      try {
        const balanceResponse = await plaidClient.accountsBalanceGet({
          access_token: item.access_token,
        });
        accounts.push(...balanceResponse.data.accounts.map(normalizePlaidAccount));
      } catch (error) {
        errors.push({ item_id: item.item_id, product: "balance", message: readablePlaidError(error) });
      }

      try {
        const liabilitiesResponse = await plaidClient.liabilitiesGet({
          access_token: item.access_token,
        });
        liabilities.push(...normalizePlaidLiabilities(liabilitiesResponse.data));
      } catch (error) {
        errors.push({ item_id: item.item_id, product: "liabilities", message: readablePlaidError(error) });
      }
    }

    response.json({ accounts, liabilities, errors });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: error.message || "Unexpected server error" });
});

app.listen(port, () => {
  console.log(`Aho Budget running at http://localhost:${port}`);
});

function requirePlaidConfig() {
  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    throw new Error("Missing PLAID_CLIENT_ID or PLAID_SECRET");
  }
}

async function readStore() {
  try {
    return JSON.parse(await fs.readFile(dataPath, "utf8"));
  } catch {
    return { items: [] };
  }
}

async function writeStore(store) {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(store, null, 2));
}

function normalizePlaidTransaction(transaction) {
  return {
    id: transaction.transaction_id,
    account_id: transaction.account_id,
    date: transaction.date,
    name: transaction.name,
    merchant: transaction.merchant_name,
    amount: transaction.amount,
    category: transaction.personal_finance_category?.primary || null,
    pending: transaction.pending,
  };
}

function normalizePlaidAccount(account) {
  return {
    id: account.account_id,
    name: account.name,
    official_name: account.official_name,
    type: account.type,
    subtype: account.subtype,
    mask: account.mask,
    available: account.balances.available,
    current: account.balances.current,
  };
}

function normalizePlaidLiabilities(data) {
  const accountsById = new Map(data.accounts.map((account) => [account.account_id, account]));
  const credit = (data.liabilities.credit || []).map((liability) => {
    const account = accountsById.get(liability.account_id);
    const purchaseApr = liability.aprs?.find((apr) => apr.apr_type === "purchase_apr");
    return {
      id: liability.account_id,
      name: account?.name || "Credit card",
      type: "credit",
      balance: Math.abs(account?.balances?.current || liability.last_statement_balance || 0),
      payment: liability.minimum_payment_amount || 0,
      interest: purchaseApr?.apr_percentage || liability.aprs?.[0]?.apr_percentage || 0,
      next_payment_due_date: liability.next_payment_due_date || null,
    };
  });

  const student = (data.liabilities.student || []).map((liability) => ({
    id: liability.account_id,
    name: liability.loan_name || liability.servicer_address?.city || "Student loan",
    type: "student",
    balance: Math.abs((liability.origination_principal_amount || 0) + (liability.outstanding_interest_amount || 0)),
    payment: liability.minimum_payment_amount || 0,
    interest: liability.interest_rate_percentage || 0,
    next_payment_due_date: liability.next_payment_due_date || null,
  }));

  const mortgage = (data.liabilities.mortgage || []).map((liability) => ({
    id: liability.account_id,
    name: liability.loan_type_description || "Mortgage",
    type: "mortgage",
    balance: Math.abs(liability.origination_principal_amount || 0),
    payment: liability.next_monthly_payment || 0,
    interest: liability.interest_rate?.percentage || 0,
    next_payment_due_date: liability.next_payment_due_date || null,
  }));

  return [...credit, ...student, ...mortgage];
}

function readablePlaidError(error) {
  return error.response?.data?.error_message || error.message || "Unknown Plaid error";
}
