CREATE TABLE "notification" (
    "notification_id" SERIAL NOT NULL,
    "audience" VARCHAR(10) NOT NULL,
    "employee_id" INTEGER,
    "type" VARCHAR(30) NOT NULL,
    "message" TEXT NOT NULL,
    "link" VARCHAR(200),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("notification_id")
);

CREATE INDEX "idx_notification_hr_unread" ON "notification"("audience", "is_read", "created_at");
CREATE INDEX "idx_notification_employee_unread" ON "notification"("employee_id", "is_read", "created_at");

ALTER TABLE "notification" ADD CONSTRAINT "notification_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;
