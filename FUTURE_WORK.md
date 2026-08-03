# Future Work

Work through these items one at a time. Review and approve each change before implementation. For database migrations, test first, preserve row counts, then apply and verify on both local PostgreSQL and Neon.

## Priority 1 — Security and operations

- Rotate the Neon database password that was previously exposed in terminal output.
  - Update local environment files and the production deployment secret.
  - Do not commit credentials.
  - Verify the application and Prisma migrations can connect with the new password before revoking the old one.
- Revisit receipt access control if receipt links become shareable or discoverable.
  - Current behavior allows any authenticated student with a receipt number to open that receipt.
  - If tightened later, admins should retain full access while students should be restricted to their own receipts.

## Priority 2 — Currency accuracy

- Replace database `Float` currency fields with fixed-precision `Decimal` fields.
  - Covers fees, payments, expenses, salaries, bonuses, tuition overrides, and inventory prices/totals.
  - Audit existing values for more than two decimal places first.
  - Update calculations and display serialization for Prisma `Decimal` values.
  - Test the migration on a disposable database, compare totals and row counts, then deploy to local and Neon.

## Priority 3 — Remaining date and time consistency

- Use the shared `Asia/Dhaka` calendar helpers for remaining server-side current-year defaults:
  - salary billing;
  - fee packages and admission fees;
  - admit cards and exam schedules;
  - report cards;
  - student yearly attendance summaries.
- Generate fee and salary receipt month prefixes using the Dhaka month instead of UTC.
- Make exam date parsing explicitly date-only/UTC and reject impossible dates.
- Normalize timetable clock storage.
  - Timetable times are currently stored as `DateTime` values created in the runtime's local timezone.
  - Audit existing local and Neon values before choosing either UTC dummy dates or integer minutes-from-midnight.
  - Preserve displayed school times during any migration.

## Working agreement

- Make one logical fix at a time and ask before changing code.
- Run ESLint, TypeScript, focused edge checks, and a production build before committing.
- Commit only relevant files; leave `dev.log` and `test-teacher-page.js` untouched unless explicitly requested.
- Never apply a production migration without before/after verification and a no-data-loss path.
