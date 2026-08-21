# PunchCloud

Attendance, data-entry production tracking, and auto-generated payroll for an office-based
data-entry workforce. Built per `attendance-production-payroll-system-design_FINAL.md`,
`punchcloud-low-level-design_FINAL.md`, `PunchCloud_All_Formulas_FINAL.md`, and
`punchcloud_frontend_structure.md`.

## Status

Backend (all 5 phases) and both frontend apps are built and **live-verified end-to-end**
against a real local PostgreSQL instance (migrated + seeded), a running backend, and both
frontend apps open in a browser:

- Login (both roles), employee CRUD with encrypted salary structures, device punch
  ingestion (with correct/incorrect API key), the attendance engine (Half-day → Present
  transition, correct late/OT-minutes math), production entry submission + validation,
  leave application → approval → attendance sync → balance update, payroll generation for
  **both pay paths with exactly correct `net_pay`** (verified by hand-calculating the
  expected figures and matching the API response), finalize → disbursement CSV export, and
  RBAC (self-access rules, role restrictions) were all exercised via real HTTP calls.
- Both React apps were opened in-browser, logged into, and walked through several pages
  (today's attendance, employee list, payroll records, a payslip detail view, the
  self-service home/payslips pages) — including confirming the Production tab correctly
  shows only for the piece-rate employee and is absent for the fixed-salary employee.
- Payroll and attendance logic additionally have a passing unit-test suite (53 tests — both
  pay paths, zero-production, zero-days-present, mid-month salary change, OT-never-paid for
  either type, approved leave never paid, weekly offs not costing salary, and the full
  monthly late allowance: threshold boundaries, 4-forgiven/5th-downgraded, and half-day pay;
  festival holidays incl. the falls-on-a-Sunday case and Off-beats-punches; plus the cron
  jobs' company-timezone date resolution).

**Timezone correctness (fixed 2026-08-21 — read this before touching any "today"/"yesterday"
logic):** every business date must be resolved in the *company's* timezone via
`wall-clock.util.todayDateKey()` (`APP_TIMEZONE`, default `Asia/Kolkata`), never from the UTC
clock and never from the server's own zone. Deriving dates with
`new Date().toISOString().slice(0, 10)` had produced two real production bugs, both caught
before deployment: the nightly attendance cron (01:00 local) processed the *day before*
yesterday every night, and the monthly payroll cron (02:00 on the 1st) resolved two months
back — it would have generated **July's payroll on 1 September**. In India the local clock is
5:30 ahead, so between midnight and 05:30 IST the UTC date is still yesterday. Covered by
`backend/test/timezone-dates.spec.ts`.

**Two real bugs were found and fixed during this live verification** (not just
type-checked — actually broken at runtime until fixed):
1. Prisma's `BigInt` primary keys (punch/attendance/production/payroll IDs) crashed
   `JSON.stringify` on any endpoint returning them — fixed with a global
   `BigInt.prototype.toJSON` in `backend/src/main.ts`.
2. The frontend's `formatDate`/`formatTime` used local-timezone formatting on timestamps
   the backend deliberately stores as UTC-labeled wall-clock digits (see
   `backend/src/common/utils/wall-clock.util.ts`), which silently shifted displayed punch
   times by the browser's UTC offset — fixed by making the formatters UTC-based too
   (`frontend/shared/src/utils/formatDate.ts`).

## Notifications

In-app notification bell (client-requested 2026-08-21) — deliberately not email, since AWS SES's
sandbox mode would require every employee's address to be verified individually before the
company scales past a handful of people. Both frontends poll `GET /notifications` /
`GET /notifications/unread-count` every 20s.

| Event | Audience |
|---|---|
| Leave request submitted | HR |
| Leave approved / rejected | Employee |
| Correction request raised | HR |
| Correction resolved | Employee |
| Payroll finalized (payslip ready) | Employee |

Backend: `modules/notifications/` (`Notification` model — `audience: "HR" \| "EMPLOYEE"`,
optional `employeeId`). Triggered inline from `leave.service.ts`, `corrections.service.ts`,
and `payroll.service.ts` at the exact point each event happens — there is no separate polling
job. Frontend: `useNotifications`/`useUnreadNotificationCount`/`useNotificationActions` in
`@punchcloud/shared`, rendered by each app's own `NotificationBell` (admin-dashboard: plain
inline SVG bell; self-service: Lucide `Bell` icon, matching each app's existing style).

`S3Service` degrades to a logged no-op when AWS credentials aren't configured (so a missing
bucket/credentials never crashes the request that triggered an archival write — punch/
production archival is supplementary to the primary DB write per the LLD). **A real S3
bucket is now connected and live-verified**: punch archival, production entry archival, and
payslip PDF upload+signed-download-URL were all confirmed working against a real AWS
account (downloaded PDF had valid `%PDF-1.7` magic bytes, fetched via a real presigned S3
URL, HTTP 200).

## Repository Layout

```
/backend                NestJS API (Node.js/TypeScript)
/frontend/shared         Shared API clients, auth context, types, components
/frontend/admin-dashboard  React app — HR (single role, manages everything)
/frontend/self-service     React app — Employee-facing PWA
docker-compose.yml        Local Postgres for dev
```

## Stack (see the approved implementation plan for full rationale)

- **Backend:** NestJS + TypeScript, Prisma ORM, PostgreSQL, JWT auth (`@nestjs/jwt` +
  `@nestjs/passport`), `@nestjs/schedule` for cron jobs, `pdf-lib` for payslips, AWS S3 SDK
  v3 for object storage.
- **Frontend:** Vite, React 18 + TypeScript, Tailwind CSS, TanStack Query, React Hook Form +
  zod, React Router v6, `vite-plugin-pwa`. pnpm workspaces monorepo.

## Deliberate deviations/gap-fills from the design docs

These were flagged in the approved implementation plan and don't change any payroll math,
attendance status order, or the two-employee-type rule:

1. **Table creation order** — the LLD's raw DDL has `user_account` referencing `employee`
   before `employee` is defined. Prisma computes FK dependency order automatically, so this
   doesn't surface as a real issue, but the Prisma schema's file order fixes it anyway.
2. **`audit_log` table** — described in LLD Section 6 but no DDL was given; added with the
   exact columns described there (`table_name`, `record_id`, `changed_by`, `old_value`,
   `new_value`, `changed_at`).
3. **`device.api_key_hash`** — LLD Section 6 requires per-device API keys; the DDL had no
   column for it. Added as a bcrypt hash, checked by `DeviceApiKeyGuard`.
4. **`employee_type` CHECK constraint** — enforces Non-Negotiable Rule #1 at the DB level,
   not just in application code.
5. **Salary column encryption** — `monthly_base_salary`/`per_record_rate` are stored as
   AES-256-GCM ciphertext (`SalaryStructureRepository`/`CryptoService`), not plaintext
   `NUMERIC`, per LLD Section 6's "salary details encrypted at rest" requirement.
6. **A few additive read endpoints** the LLD didn't spell out but that the design docs'
   described UI can't function without: `GET /payroll?month=&year=` (list a month's records
   across employees, for the HR review-before-finalize screen in design doc 5.7);
   `GET /employees/:id` and `GET /leave/requests` now also allow self-access for the
   `Employee` role (forced to their own `employeeId` server-side), matching the self-access
   pattern the LLD already uses everywhere else (attendance, production, payroll, leave
   balance) — needed for the self-service app's own-record, own-leave-requests pages.
7. **PDF library:** `pdf-lib` instead of Puppeteer (the LLD's other listed option) — no
   headless-Chromium dependency to run in a container.
8. **Employee creation now requires `email` and auto-creates a login**, and there's an
   HR-only `POST /employees/:employee_id/reset-password` — neither is an LLD endpoint. The
   original schema/API had no path from "HR adds an employee" to "that employee can log in"
   at all, and no way to recover a forgotten password without email infrastructure. See
   Known Gaps below.
9. **Client-requested role consolidation (2026-08-20, two steps): `Supervisor`, `Finance`,
   and `Admin` all removed** — this company runs with a single HR person handling literally
   everything (employee onboarding, shift/device setup, punch/attendance oversight,
   production entry, payroll generation, and the disbursement file that was previously
   Finance-only). This is a deviation from the LLD's original 5-role model (Admin, HR,
   Supervisor, Employee, Finance — LLD Section 6.8), not something either design doc
   anticipated. `Role` is now just `HR | Employee` (`backend/src/common/roles.enum.ts`);
   every endpoint and nav item that previously required Supervisor/Finance/Admin now just
   requires HR. If a future client needs role separation back, it's a straightforward
   revert — the RBAC pattern (`@Roles(...)` decorators, `Sidebar.tsx`'s per-item `roles`
   arrays) is unchanged, only the role lists themselves were edited.

## Environment Variables

### Backend (`backend/.env` — copy from `backend/.env.example`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `PORT` | API port (default 3000) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT signing secrets |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes |
| `SALARY_ENCRYPTION_KEY` | Base64 32-byte AES-256-GCM key for salary columns — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `S3_BUCKET` | S3 for punch/production archival and payslip PDFs |
| `S3_ENDPOINT` | Optional — point at a local S3-compatible service (e.g. MinIO) instead of real AWS |
| `DEVICE_API_KEY_PEPPER` | Reserved for future device-key hardening |

A working `.env` with freshly-generated dev secrets has already been created for you at
`backend/.env` — replace the AWS values with real credentials (or a local MinIO endpoint)
before testing S3-backed features.

### Frontend (`frontend/admin-dashboard/.env`, `frontend/self-service/.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL, default `http://localhost:3000/api/v1` |

## Setup

### 1. Install dependencies (once, from the repo root)

```bash
pnpm install
```

### 2. Get a Postgres instance running

Preferred — Docker:

```bash
docker compose up -d
```

If Docker isn't available, point `DATABASE_URL` in `backend/.env` at any reachable
Postgres 14+ instance instead (a local install, RDS, etc.).

### 3. Run migrations and seed data

```bash
cd backend
pnpm prisma:generate
pnpm prisma:migrate      # creates the schema from prisma/schema.prisma
pnpm prisma:seed         # roles, leave types, a shift, a demo device, 2 demo employees (one of each pay type), 6 demo users
```

Seed output prints a demo device API key for the ingestion endpoint, and creates these
login accounts (password for all: `Password123!`):

| Email | Role |
|---|---|
| hr@punchcloud.dev | HR (the one role that manages everything) |
| asha.rao@punchcloud.dev | Employee (fixed-salary) |
| ravi.kumar@punchcloud.dev | Employee (piece-rate) |

### 4. Start the backend

```bash
cd backend
pnpm start:dev
```

API is at `http://localhost:3000/api/v1`, Swagger docs at
`http://localhost:3000/api/v1/docs`, health check at `http://localhost:3000/api/v1/health`.

### 5. Simulate a punch (no physical device needed)

```bash
cd backend
pnpm mock:punch -- --employee=BIO-0001 --direction=IN
pnpm mock:punch -- --employee=BIO-0001 --direction=OUT --at=2026-08-18T18:05:00
```

### 6. Start both frontend apps

```bash
# from repo root, in two separate terminals
pnpm dev:admin          # http://localhost:5173
pnpm dev:self-service    # http://localhost:5174
```

### 7. Run tests

```bash
cd backend
pnpm test                # full suite
npx jest test/payroll-calculation.spec.ts test/payroll.service.spec.ts   # payroll only
```

### 8. Manually trigger the scheduled jobs (instead of waiting for cron)

```bash
cd backend
pnpm job:attendance -- --date=2026-08-18
pnpm job:payroll -- --month=8 --year=2026
```

## Non-Negotiable Business Rules (implemented, tested, do not change without re-confirming)

> Rules 3, 5, 7, 8 and 9–10 were **added or revised by the client on 2026-08-21** (paid leave
> removed from the formula, holiday handling removed, monthly late allowance added). The
> original `PunchCloud_All_Formulas_FINAL.md` wording is stale on those points — this list wins.

1. Every employee is exactly `piece_rate` or `fixed_salary` — no third type
   (`salary_structure.employee_type` CHECK constraint + `CreateSalaryStructureDto`).
2. **Piece-rate: `net_pay = total_accepted_pieces × per_record_rate`.** Nothing else affects
   it — not attendance, not leave, not lateness, not OT
   (`payroll-calculation.ts::calculatePieceRateNetPay`). Their attendance is still recorded,
   but only as information for HR.
3. **Fixed-salary: `net_pay = (payable_days / working_days) × monthly_base_salary`**, where
   `payable_days = days_present + 0.5 × days_half_day` — days actually worked are the only
   input (`payroll-calculation.ts::calculateFixedSalaryNetPay` / `calculatePayableDays`).
4. **Nobody is paid overtime** — not piece-rate, not fixed-salary (client re-confirmed
   2026-08-21: fixed-salary staff don't work OT at this company at all). `total_ot_minutes`
   is stored and rendered on every payslip, and structurally cannot enter either net-pay
   function — neither takes an OT parameter.
5. **There is no paid leave.** Leave is still requested, approved and recorded, but a leave
   day is simply not a present day, so it earns nothing — even for a `leave_type` flagged
   `is_paid`. `days_on_paid_leave` is reported on the payslip but never enters `net_pay`.
6. No PF/ESI/Professional Tax/TDS/HRA/incentive-on-top. `net_pay` is the final number —
   payslip UI/PDF never renders a gross-to-net breakdown.
7. **Attendance status resolution order: Off → punched → Present/Half-day → On Leave →
   Absent** (`AttendanceService.computeAttendance`). There is no `Holiday` status: `"Off"`
   covers a weekly off from the employee's shift *and* a festival holiday.
   **`Off` wins over punches** — an employee who comes in on a Sunday or on Diwali is still
   `Off` for the day. Their punches are still recorded so HR can see who was in the building,
   but the day earns nothing extra, no late/OT minutes are computed for it, and `is_late`
   stays false so it never eats into the monthly late allowance. (Letting punches win instead
   paid *more* than the monthly salary: the day sits outside `working_days` — the denominator
   — while adding to the present count, the numerator.) `Off` is also resolved before approved
   leave, so a leave request spanning a weekend doesn't burn leave balance on the weekend days.
8. **`working_days = total_days_in_month − weekly_off_days − festival_holidays`**
   (`working-days.util.ts`). The company observes exactly two festival holidays a year —
   Diwali and Holi — whose dates HR enters into `holiday_calendar` each year via
   **Settings → Shifts → Festival Holidays**. A festival that falls on a weekly off is NOT
   subtracted twice (`PayrollService.countFestivalHolidaysInMonth` de-duplicates); double
   subtraction would shrink the denominator below the real workday count and pay a
   fully-present employee more than their salary.
9. **Monthly late-comer allowance.** Arriving more than `shift.late_threshold_minutes`
   (default 15) after `shift.start_time` marks the day late (`attendance_daily.is_late`).
   The first `shift.late_days_allowed_per_month` (default 4) late days in a calendar month
   are forgiven and stay a full `Present`; every late day after that is downgraded to
   `Half-day`, which is worth half a day's pay. The count resets on the 1st. Measured from
   `start_time`, NOT from the grace period — `grace_period_minutes` only affects the reported
   `late_minutes` figure. Applies to every employee, but only changes money for fixed-salary
   staff, since piece-rate pay ignores attendance entirely (rule 2).
10. A `Half-day` also results from a single punch (employee forgot to punch out). Both causes
   are worth 0.5 of a payable day.
11. Only `first_in`/`last_out` matter per day (`AttendanceService.computeAttendance`).

Fixed-salary employees can also have production recorded; those pieces roll into the
company's total production report only, never into anyone's pay.

**Operational note:** Diwali and Holi move every year, so HR must add that year's two dates
before the month's payroll runs. Adding or removing a holiday only affects attendance rows
that are recomputed afterwards — re-run **Attendance → Recalculate** for the affected month
(the UI says so on the Festival Holidays form). Already-`finalized`/`paid` payroll is never
recomputed, by design.

## What's Out of Scope (per the original brief)

- Physical punch device SDK/hardware — the ingestion API + `scripts/mock-punch.ts` stand in
  for it; wire in a real device's push/poll protocol against `DeviceApiKeyGuard`/
  `IngestionController` once a brand/model is chosen.
- Live bank disbursement API — `GET /payroll/disbursement-file` produces a NEFT/RTGS-style
  CSV export only.
- Native mobile apps — both frontends are installable PWAs (`vite-plugin-pwa`).

## Known Gaps to Close Before Production

- Real AWS S3 is connected and live-verified (see Status above) — the `AWS_ACCESS_KEY_ID`/
  `AWS_SECRET_ACCESS_KEY`/`S3_BUCKET` currently in `backend/.env` point at a real bucket the
  user provisioned. The IAM user's policy has been scoped down from `AmazonS3FullAccess` to
  a custom `PunchCloudS3Access` policy limited to `s3:PutObject`/`s3:GetObject`/
  `s3:ListBucket` on just this one bucket — re-verified working (punch archival, PDF
  upload, signed download) after the scope-down. Rotate these keys before any real
  deployment if they were ever shared outside this environment.
- Wire SES/SNS for the notification stubs described in Phase 5 of the design doc (payslip
  ready, leave-approval reminders) — not yet implemented, flagged as a Phase 5 follow-up.
  This also blocks a proper self-service "forgot password" (email a reset link) — for now,
  HR can reset any employee's password from the employee detail page
  (`POST /employees/:employee_id/reset-password`, not an LLD endpoint — added to close a
  real gap: there was no way to recover a forgotten login at all, and no way for a newly
  onboarded employee to get login credentials in the first place). Creating an employee now
  requires an email and auto-creates their self-service login; the generated password is
  shown to HR exactly once and must be relayed to the employee directly.
- Rotate `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`/`SALARY_ENCRYPTION_KEY` before any real
  deployment; the ones in `backend/.env` are dev-only values generated during this build.
- The golden path (login → punch → attendance appears → leave apply/approve → production
  entry → payroll generate → payslip visible) has been walked in both frontend apps against
  live data — but only for the two seeded demo employees and a handful of pages per app.
  Give the rest of each app (settings pages, correction workflow, disbursement download,
  PWA install) a pass before considering it launch-ready.
