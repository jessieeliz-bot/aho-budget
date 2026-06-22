# Aho Budget

A lightweight household budgeting app inspired by the existing Google Sheet.

## What It Does

- Shows a simple weekly "safe to spend" number.
- Keeps the detailed monthly bill and income calendar from the spreadsheet.
- Tracks manual spending by category.
- Saves changes in browser local storage.
- Runs manually as a static site, or with a small Node server for Plaid bank sync.

## Run Locally

For manual budgeting only, you can still open `index.html` in a browser.

For Plaid bank sync, use the Node server:

```bash
npm install
cp .env.example .env
npm start
```

Then visit `http://localhost:5173`.

## Plaid Bank Sync

Bank sync uses Plaid Link and Transactions Sync:

1. Create a Plaid account and get Sandbox keys from the Plaid dashboard.
2. Put `PLAID_CLIENT_ID`, `PLAID_SECRET`, and `PLAID_ENV=sandbox` in `.env`.
3. Start the server with `npm start`.
4. Click **Connect Bank**.
5. Use Plaid Sandbox credentials to test. For realistic transaction data, Plaid documents the `user_transactions_dynamic` Sandbox user with any non-blank password.
6. Click **Sync Bank** to import spending transactions into the tracker.

This local version stores Plaid access tokens in `.data/plaid.json`, which is ignored by Git. Before using real Production bank data, move token storage to a real database and add sign-in.

## Connecting Real Accounts

Sandbox uses fake banks. To connect your real bank, use Plaid's Launch Center in the Plaid Dashboard and request Production access for the products this app uses:

- Transactions, for spending imports.
- Balance, via `/accounts/balance/get`, for current account balances.
- Liabilities, for credit card and loan balances when your institutions support it.

Once Plaid approves access:

```bash
PLAID_ENV=production
PLAID_SECRET=your-production-secret
```

Then restart the app:

```bash
npm start
```

Keep `.env` and `.data/plaid.json` private. Do not commit them to GitHub.

Plaid references:

- [Plaid Link Web docs](https://plaid.com/docs/link/web/)
- [Plaid Transactions overview](https://plaid.com/docs/transactions/)
- [Plaid Balance overview](https://plaid.com/docs/balance/)
- [Plaid Liabilities overview](https://plaid.com/docs/liabilities/)

## GitHub Hosting Note

GitHub Pages can host the manual app, but it cannot safely host Plaid secrets. For bank sync, deploy the Node server to a backend host such as Render, Fly.io, Railway, or a small VPS.
