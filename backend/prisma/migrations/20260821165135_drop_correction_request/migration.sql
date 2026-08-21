-- Client decision 2026-08-21: no correction/dispute workflow — a new punching machine is
-- not expected to fail, and a missed punch is the employee's own responsibility. Removed
-- from both frontends and the backend entirely.
ALTER TABLE "correction_request" DROP CONSTRAINT IF EXISTS "correction_request_employee_id_fkey";
ALTER TABLE "correction_request" DROP CONSTRAINT IF EXISTS "correction_request_resolved_by_fkey";
DROP TABLE "correction_request";
