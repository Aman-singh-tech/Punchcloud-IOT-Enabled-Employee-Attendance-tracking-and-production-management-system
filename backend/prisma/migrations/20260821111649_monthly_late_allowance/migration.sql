-- Monthly late-comer allowance: more than late_threshold_minutes after shift start marks a
-- day late; the first late_days_allowed_per_month are forgiven, the rest become Half-day.
ALTER TABLE "shift" ADD COLUMN "late_threshold_minutes" INTEGER NOT NULL DEFAULT 15;
ALTER TABLE "shift" ADD COLUMN "late_days_allowed_per_month" INTEGER NOT NULL DEFAULT 4;

ALTER TABLE "attendance_daily" ADD COLUMN "is_late" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "payroll_record" ADD COLUMN "days_half_day" INTEGER;
ALTER TABLE "payroll_record" ADD COLUMN "days_late" INTEGER;
