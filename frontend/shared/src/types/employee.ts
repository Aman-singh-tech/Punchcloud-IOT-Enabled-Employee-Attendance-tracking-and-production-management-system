// Non-Negotiable Rule #1: exactly two employee types, never a third.
export type EmployeeType = "piece_rate" | "fixed_salary";

export interface SalaryStructure {
  salaryStructureId: number;
  employeeId: number;
  employeeType: EmployeeType;
  monthlyBaseSalary: number | null;
  perRecordRate: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface Employee {
  employeeId: number;
  employeeCode: string;
  deviceEnrollmentId: string | null;
  name: string;
  designation: string | null;
  departmentId: number | null;
  locationId: number | null;
  shiftId: number | null;
  dateOfJoining: string | null;
  status: "active" | "inactive" | "terminated";
  salaryStructures?: SalaryStructure[];
}

// Client-requested change: this company runs with a single HR person handling literally
// everything — no separate Admin, Supervisor, or Finance role.
export type Role = "HR" | "Employee";

export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: Role;
  employeeId: number | null;
  employeeName?: string;
}
