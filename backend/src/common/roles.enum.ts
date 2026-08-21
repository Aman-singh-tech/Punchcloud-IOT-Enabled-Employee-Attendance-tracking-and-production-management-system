// The LLD's original Section 6.8 role breakdown had 5 roles (Admin, HR, Supervisor,
// Employee, Finance). Client-requested change (2026-08-20, two steps): first Supervisor
// and Finance were folded into HR/Admin, then Admin was folded into HR too — this company
// runs with a single HR person handling literally everything (employee onboarding, system
// config like shifts/devices, punch/attendance, production entry, payroll, disbursement).
// See git history for the prior 5-role RBAC if this ever needs to be reintroduced for a
// different client.
export enum Role {
  HR = "HR",
  EMPLOYEE = "Employee",
}

export const ALL_ROLES = Object.values(Role);
