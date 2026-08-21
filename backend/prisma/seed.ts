import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { randomBytes, createCipheriv } from "crypto";

const prisma = new PrismaClient();

function encryptDecimal(value: string): Buffer {
  const keyB64 = process.env.SALARY_ENCRYPTION_KEY;
  if (!keyB64) throw new Error("SALARY_ENCRYPTION_KEY is not set");
  const key = Buffer.from(keyB64, "base64");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]);
}

async function main() {
  console.log("Seeding roles...");
  // Client-requested change: this company runs with a single HR person handling literally
  // everything — no separate Admin, Supervisor, or Finance role (see common/roles.enum.ts).
  const roleNames = ["HR", "Employee"];
  const roles: Record<string, number> = {};
  for (const name of roleNames) {
    const role = await prisma.role.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    roles[name] = role.roleId;
  }

  console.log("Seeding leave types...");
  const leaveTypeSeed = [
    { name: "Paid", isPaid: true, annualQuota: 12 },
    { name: "Sick", isPaid: true, annualQuota: 8 },
    { name: "Casual", isPaid: true, annualQuota: 6 },
    { name: "Comp-off", isPaid: true, annualQuota: 0 },
    { name: "Unpaid", isPaid: false, annualQuota: 0 },
  ];
  for (const lt of leaveTypeSeed) {
    await prisma.leaveType.upsert({ where: { name: lt.name }, create: lt, update: lt });
  }

  console.log("Seeding location/department/shift/device...");
  const location = await prisma.location.upsert({
    where: { locationId: 1 },
    create: { name: "Head Office", state: "Karnataka", timezone: "Asia/Kolkata" },
    update: {},
  });
  const department = await prisma.department.upsert({
    where: { departmentId: 1 },
    create: { name: "Data Entry", locationId: location.locationId },
    update: {},
  });
  const shift = await prisma.shift.upsert({
    where: { shiftId: 1 },
    create: {
      name: "General Shift",
      startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
      endTime: new Date(Date.UTC(1970, 0, 1, 18, 0, 0)),
      gracePeriodMinutes: 10,
      standardHours: 8.0,
      weeklyOffDays: [0], // Sunday
    },
    update: {},
  });

  const deviceApiKey = "dev-device-key-please-change";
  const apiKeyHash = await bcrypt.hash(deviceApiKey, 10);
  await prisma.device.upsert({
    where: { deviceId: 1 },
    create: {
      deviceName: "Main Entrance Biometric",
      locationId: location.locationId,
      ipAddress: "192.168.1.50",
      apiKeyHash,
    },
    update: {},
  });
  console.log(`Demo device #1 API key (dev only, rotate before real use): ${deviceApiKey}`);

  console.log("Seeding demo employees (one of each employee_type)...");
  const fixedSalaryEmployee = await prisma.employee.upsert({
    where: { employeeCode: "EMP-0001" },
    create: {
      employeeCode: "EMP-0001",
      deviceEnrollmentId: "BIO-0001",
      name: "Asha Rao",
      designation: "HR Executive",
      departmentId: department.departmentId,
      locationId: location.locationId,
      shiftId: shift.shiftId,
      dateOfJoining: new Date(Date.UTC(2024, 0, 15)),
      status: "active",
    },
    update: {},
  });
  await prisma.salaryStructure.deleteMany({ where: { employeeId: fixedSalaryEmployee.employeeId } });
  await prisma.salaryStructure.create({
    data: {
      employeeId: fixedSalaryEmployee.employeeId,
      employeeType: "fixed_salary",
      monthlyBaseSalaryEnc: encryptDecimal("25000.00"),
      perRecordRateEnc: null,
      effectiveFrom: new Date(Date.UTC(2024, 0, 15)),
      effectiveTo: null,
    },
  });

  const pieceRateEmployee = await prisma.employee.upsert({
    where: { employeeCode: "EMP-0002" },
    create: {
      employeeCode: "EMP-0002",
      deviceEnrollmentId: "BIO-0002",
      name: "Ravi Kumar",
      designation: "Data Entry Operator",
      departmentId: department.departmentId,
      locationId: location.locationId,
      shiftId: shift.shiftId,
      dateOfJoining: new Date(Date.UTC(2024, 2, 1)),
      status: "active",
    },
    update: {},
  });
  await prisma.salaryStructure.deleteMany({ where: { employeeId: pieceRateEmployee.employeeId } });
  await prisma.salaryStructure.create({
    data: {
      employeeId: pieceRateEmployee.employeeId,
      employeeType: "piece_rate",
      monthlyBaseSalaryEnc: null,
      perRecordRateEnc: encryptDecimal("1.00"),
      effectiveFrom: new Date(Date.UTC(2024, 2, 1)),
      effectiveTo: null,
    },
  });

  console.log("Seeding user accounts (dev password for all: Password123!)...");
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const userSeed: Array<{ email: string; role: string; employeeId?: number }> = [
    { email: "hr@punchcloud.dev", role: "HR" },
    { email: "asha.rao@punchcloud.dev", role: "Employee", employeeId: fixedSalaryEmployee.employeeId },
    { email: "ravi.kumar@punchcloud.dev", role: "Employee", employeeId: pieceRateEmployee.employeeId },
  ];
  for (const u of userSeed) {
    await prisma.userAccount.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        passwordHash,
        roleId: roles[u.role],
        employeeId: u.employeeId,
      },
      update: {},
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
