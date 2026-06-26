# xx$$money$$xx

A private home-screen budgeting app for Jessica + Troye.

This version intentionally starts simple:

- no paid bank connection
- one Friday-to-Thursday spending pile
- clear safe-to-spend number capped by checking after bills
- editable checking balance
- paycheck-based bills-before-payday cushion
- rolling pay-period forecast
- Bills tab with the recurring bill schedule by day number
- groceries, gas, and spending split from the same weekly bin
- editable recurring and one-time bills/payments
- custom bill/payment recurrence like calendar repeats
- editable one-time and recurring income
- manual spending entry
- statement upload from bank exports with auto-categorized spending

## Source Of Truth

The app is seeded from the Google Sheet workflow:

- current bank balance can be updated in the app
- pay periods reset around biweekly Friday paychecks and 15th/30th paychecks
- estimated rollover from `June 2026!G1`
- weekly spending markers from `June 2026`
- baby savings goal set to `$2,000`
- full recurring bill schedule from the top row of `Annual Budget`

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
