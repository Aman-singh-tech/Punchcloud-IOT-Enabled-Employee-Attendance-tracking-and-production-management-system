"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const prisma = new client_1.PrismaClient();
function encryptDecimal(value) {
    const keyB64 = process.env.SALARY_ENCRYPTION_KEY;
    if (!keyB64)
        throw new Error("SALARY_ENCRYPTION_KEY is not set");
    const key = Buffer.from(keyB64, "base64");
    const iv = (0, crypto_1.randomBytes)(12);
    const cipher = (0, crypto_1.createCipheriv)("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, ciphertext]);
}
async function main() {
    console.log("Seeding roles...");
    const roleNames = ["Admin", "HR", "Supervisor", "Employee", "Finance"];
    const roles = {};
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
            weeklyOffDays: [0],
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
    const userSeed = [
        { email: "admin@punchcloud.dev", role: "Admin" },
        { email: "hr@punchcloud.dev", role: "HR" },
        { email: "supervisor@punchcloud.dev", role: "Supervisor" },
        { email: "finance@punchcloud.dev", role: "Finance" },
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
//# sourceMappingURL=seed.js.map