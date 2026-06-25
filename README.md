# Money Party

A private home-screen budgeting app for Jessica + Troye.

This version intentionally starts simple:

- no paid bank connection
- one Friday-to-Thursday spending pile
- quick "Can I spend this?" answer
- manual spending entry
- statement upload from bank exports

## Source Of Truth

The app is seeded from the Google Sheet workflow:

- current bank balance from `June 2026!C1`
- estimated rollover from `June 2026!G1`
- weekly spending markers from `June 2026`
- savings goal/current savings from `June 2026!E50:G50`
- bills and due dates from `June 2026!A:C`

The bank export format tested:

- `AccountHistory.xls`
- columns: `Account Number`, `Post Date`, `Check`, `Description`, `Debit`, `Credit`, `Status`, `Balance`, `Classification`

## Run Locally

```bash
cd /Users/jessicaaho/Documents/budgeting
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## Phone Home Screen

Open the local or hosted app in Safari/Chrome, then use **Add to Home Screen**.
