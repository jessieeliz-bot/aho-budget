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
      products: [Products.Transactions],
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
