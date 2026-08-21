import { apiClient } from "./apiClient";
import { Employee, EmployeeType } from "../types/employee";

export interface CreateSalaryStructureInput {
  employeeType: EmployeeType;
  monthlyBaseSalary?: number;
  perRecordRate?: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface CreateEmployeeInput {
  employeeCode: string;
  email: string;
  deviceEnrollmentId?: string;
  name: string;
  designation?: string;
  departmentId?: number;
  locationId?: number;
  shiftId?: number;
  dateOfJoining?: string;
  salaryStructure: CreateSalaryStructureInput;
}

export interface CreateEmployeeResult extends Employee {
  loginEmail: string;
  temporaryPassword: string;
}

export interface ResetPasswordResult {
  loginEmail: string;
  temporaryPassword: string;
}

export const employeeApi = {
  list: () => apiClient.get<Employee[]>("/employees").then((r) => r.data),
  get: (employeeId: number) => apiClient.get<Employee>(`/employees/${employeeId}`).then((r) => r.data),
  create: (input: CreateEmployeeInput) =>
    apiClient.post<CreateEmployeeResult>("/employees", input).then((r) => r.data),
  update: (employeeId: number, input: Partial<CreateEmployeeInput>) =>
    apiClient.patch<Employee>(`/employees/${employeeId}`, input).then((r) => r.data),
  changeSalaryStructure: (employeeId: number, input: CreateSalaryStructureInput) =>
    apiClient.post(`/employees/${employeeId}/salary-structure`, input).then((r) => r.data),
  resetPassword: (employeeId: number) =>
    apiClient.post<ResetPasswordResult>(`/employees/${employeeId}/reset-password`).then((r) => r.data),
};
