-- AlterTable
ALTER TABLE "payroll_record" ADD COLUMN     "days_off" INTEGER,
ADD COLUMN     "ot_amount" DECIMAL(10,2),
ADD COLUMN     "working_days" INTEGER;
