-- Non-Negotiable Rule #1: employee_type is exactly 'piece_rate' or 'fixed_salary', never a
-- third value. Enforced at the DB level, not just in application code (Prisma has no
-- native CHECK-constraint syntax, hence a raw SQL migration).
ALTER TABLE "salary_structure"
  ADD CONSTRAINT "salary_structure_employee_type_check"
  CHECK ("employee_type" IN ('piece_rate', 'fixed_salary'));
