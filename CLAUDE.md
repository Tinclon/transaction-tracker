# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn start          # Run the tracker; reads all CSVs from ./statements/
node transaction-tracker.js  # Equivalent direct invocation
```

No build, test, or lint steps exist.

## Architecture

Single-purpose CLI that reads CSV bank statements, categorizes transactions, and prints a colored financial summary to stdout.

**Entry point**: `transaction-tracker.js`
1. Reads all CSV files from `./statements/` (columns: date, description, debit, credit, balance)
2. Deduplicates by composite key (date + description + debit + credit)
3. Converts dates to ISO format, calculates signed amount (debit → negative, credit → positive)
4. Categorizes each transaction through a three-layer pipeline (see below)
5. Aggregates by yearMonth + category, prints monthly and yearly summaries

**Categorization pipeline** (`categories/`):
- `custom.js` — checked first; per-transaction overrides matching on description + amount + optional date; handles reimbursements and internal transfers
- `standard.js` — 47 regex-based categories with priority ordering; each entry has `{ priority, regexes, constraint? }` where lower priority matches first and `constraint` is an optional function for amount-based disambiguation
- `special.js` — list of category names that receive asterisk markers in output

**`categories/` is gitignored** — the files exist locally but won't appear in a fresh clone. Don't assume their contents; read them before editing.

**`statements/` is also gitignored** — CSV input files are local only. Do not ever edit files in this folder.

## Categorizing Transactions

When given a list of transactions to categorize:

1. Read `categories/standard.js` and `categories/custom.js` before proposing anything.
2. For each transaction, determine whether the payee/vendor is likely to recur (e.g. a known chain, utility, or service) or is a one-off (e.g. a specific reimbursement, unusual purchase, or unique merchant). Recurring vendors belong in `standard.js`; one-off transactions belong in `custom.js`.
3. Display all proposed changes — new regex entries for `standard.js` and/or new entries for `custom.js` — and wait for explicit confirmation before making any edits.

When inserting into `standard.js`, preserve the roughly alphabetical ordering of regexes within each category's `regexes` array.
