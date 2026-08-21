-- CreateTable
CREATE TABLE "location" (
    "location_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "state" VARCHAR(50),
    "timezone" VARCHAR(50) DEFAULT 'Asia/Kolkata',

    CONSTRAINT "location_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "department" (
    "department_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "location_id" INTEGER,

    CONSTRAINT "department_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "role" (
    "role_id" SERIAL NOT NULL,
    "name" VARCHAR(30) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "user_account" (
    "user_id" SERIAL NOT NULL,
    "employee_id" INTEGER,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "shift" (
    "shift_id" SERIAL NOT NULL,
    "name" VARCHAR(50),
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "grace_period_minutes" INTEGER NOT NULL DEFAULT 10,
    "standard_hours" DECIMAL(4,2) NOT NULL DEFAULT 8.0,
    "weekly_off_days" INTEGER[] DEFAULT ARRAY[0]::INTEGER[],

    CONSTRAINT "shift_pkey" PRIMARY KEY ("shift_id")
);

-- CreateTable
CREATE TABLE "employee" (
    "employee_id" SERIAL NOT NULL,
    "employee_code" VARCHAR(20) NOT NULL,
    "device_enrollment_id" VARCHAR(50),
    "name" VARCHAR(150) NOT NULL,
    "designation" VARCHAR(100),
    "department_id" INTEGER,
    "location_id" INTEGER,
    "shift_id" INTEGER,
    "date_of_joining" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',

    CONSTRAINT "employee_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "salary_structure" (
    "salary_structure_id" SERIAL NOT NULL,
    "employee_id" INTEGER,
    "employee_type" VARCHAR(20) NOT NULL,
    "monthly_base_salary_enc" BYTEA,
    "per_record_rate_enc" BYTEA,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,

    CONSTRAINT "salary_structure_pkey" PRIMARY KEY ("salary_structure_id")
);

-- CreateTable
CREATE TABLE "device" (
    "device_id" SERIAL NOT NULL,
    "device_name" VARCHAR(100),
    "location_id" INTEGER,
    "ip_address" VARCHAR(50),
    "last_sync_at" TIMESTAMP(6),
    "api_key_hash" VARCHAR(255),

    CONSTRAINT "device_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "punch_log" (
    "punch_id" BIGSERIAL NOT NULL,
    "employee_id" INTEGER,
    "device_id" INTEGER,
    "punch_timestamp" TIMESTAMP(6) NOT NULL,
    "direction" VARCHAR(3),
    "raw_payload_s3_key" VARCHAR(300),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "punch_log_pkey" PRIMARY KEY ("punch_id")
);

-- CreateTable
CREATE TABLE "holiday_calendar" (
    "holiday_id" SERIAL NOT NULL,
    "holiday_date" DATE NOT NULL,
    "name" VARCHAR(100),
    "location_id" INTEGER,

    CONSTRAINT "holiday_calendar_pkey" PRIMARY KEY ("holiday_id")
);

-- CreateTable
CREATE TABLE "leave_type" (
    "leave_type_id" SERIAL NOT NULL,
    "name" VARCHAR(30),
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "annual_quota" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "leave_type_pkey" PRIMARY KEY ("leave_type_id")
);

-- CreateTable
CREATE TABLE "leave_balance" (
    "employeeId" INTEGER NOT NULL,
    "leave_type_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "allotted" DECIMAL(5,1) NOT NULL,
    "used" DECIMAL(5,1) NOT NULL DEFAULT 0,

    CONSTRAINT "leave_balance_pkey" PRIMARY KEY ("employeeId","leave_type_id","year")
);

-- CreateTable
CREATE TABLE "leave_request" (
    "leave_id" SERIAL NOT NULL,
    "employee_id" INTEGER,
    "leave_type_id" INTEGER,
    "from_date" DATE NOT NULL,
    "to_date" DATE NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "approved_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_request_pkey" PRIMARY KEY ("leave_id")
);

-- CreateTable
CREATE TABLE "attendance_daily" (
    "attendance_id" BIGSERIAL NOT NULL,
    "employee_id" INTEGER,
    "attendance_date" DATE NOT NULL,
    "first_in" TIMESTAMP(6),
    "last_out" TIMESTAMP(6),
    "late_minutes" INTEGER NOT NULL DEFAULT 0,
    "ot_minutes" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20),
    "leave_type_id" INTEGER,
    "is_manually_adjusted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "attendance_daily_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateTable
CREATE TABLE "production_entry" (
    "entry_id" BIGSERIAL NOT NULL,
    "employee_id" INTEGER,
    "entry_date" DATE NOT NULL,
    "records_produced" INTEGER NOT NULL DEFAULT 0,
    "records_accepted" INTEGER NOT NULL DEFAULT 0,
    "records_rejected" INTEGER NOT NULL DEFAULT 0,
    "rejection_reason" TEXT,
    "submitted_by" INTEGER,
    "submitted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_entry_pkey" PRIMARY KEY ("entry_id")
);

-- CreateTable
CREATE TABLE "payroll_record" (
    "payroll_id" BIGSERIAL NOT NULL,
    "employee_id" INTEGER,
    "month" INTEGER,
    "year" INTEGER,
    "employee_type" VARCHAR(20),
    "days_present" INTEGER,
    "days_absent" INTEGER,
    "days_on_paid_leave" INTEGER,
    "days_on_unpaid_leave" INTEGER,
    "total_late_minutes" INTEGER,
    "total_ot_minutes" INTEGER,
    "total_produced" INTEGER,
    "total_accepted" INTEGER,
    "total_rejected" INTEGER,
    "net_pay" DECIMAL(10,2),
    "report_s3_key" VARCHAR(300),
    "generated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',

    CONSTRAINT "payroll_record_pkey" PRIMARY KEY ("payroll_id")
);

-- CreateTable
CREATE TABLE "correction_request" (
    "request_id" SERIAL NOT NULL,
    "employee_id" INTEGER,
    "request_type" VARCHAR(30),
    "target_date" DATE,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "resolved_by" INTEGER,
    "resolved_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correction_request_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "audit_log_id" SERIAL NOT NULL,
    "table_name" VARCHAR(50) NOT NULL,
    "record_id" VARCHAR(50) NOT NULL,
    "changed_by" INTEGER,
    "old_value" JSONB,
    "new_value" JSONB,
    "changed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("audit_log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_email_key" ON "user_account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employee_employee_code_key" ON "employee"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "employee_device_enrollment_id_key" ON "employee"("device_enrollment_id");

-- CreateIndex
CREATE INDEX "idx_punch_employee_date" ON "punch_log"("employee_id", "punch_timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "punch_log_employee_id_punch_timestamp_key" ON "punch_log"("employee_id", "punch_timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "leave_type_name_key" ON "leave_type"("name");

-- CreateIndex
CREATE INDEX "idx_attendance_emp_month" ON "attendance_daily"("employee_id", "attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_daily_employee_id_attendance_date_key" ON "attendance_daily"("employee_id", "attendance_date");

-- CreateIndex
CREATE INDEX "idx_production_emp_month" ON "production_entry"("employee_id", "entry_date");

-- CreateIndex
CREATE UNIQUE INDEX "production_entry_employee_id_entry_date_key" ON "production_entry"("employee_id", "entry_date");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_record_employee_id_month_year_key" ON "payroll_record"("employee_id", "month", "year");

-- CreateIndex
CREATE INDEX "idx_audit_table_record" ON "audit_log"("table_name", "record_id");

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_account" ADD CONSTRAINT "user_account_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_account" ADD CONSTRAINT "user_account_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shift"("shift_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structure" ADD CONSTRAINT "salary_structure_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device" ADD CONSTRAINT "device_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "punch_log" ADD CONSTRAINT "punch_log_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "punch_log" ADD CONSTRAINT "punch_log_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("device_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday_calendar" ADD CONSTRAINT "holiday_calendar_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balance" ADD CONSTRAINT "leave_balance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balance" ADD CONSTRAINT "leave_balance_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_type"("leave_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_type"("leave_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "user_account"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_daily" ADD CONSTRAINT "attendance_daily_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_daily" ADD CONSTRAINT "attendance_daily_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_type"("leave_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_entry" ADD CONSTRAINT "production_entry_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_entry" ADD CONSTRAINT "production_entry_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "user_account"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_record" ADD CONSTRAINT "payroll_record_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correction_request" ADD CONSTRAINT "correction_request_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correction_request" ADD CONSTRAINT "correction_request_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "user_account"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "user_account"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
