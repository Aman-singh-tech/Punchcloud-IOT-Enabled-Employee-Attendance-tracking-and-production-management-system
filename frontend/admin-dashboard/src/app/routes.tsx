import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@punchcloud/shared";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { LoginPage } from "../pages/auth/LoginPage";
import { DashboardHomePage } from "../pages/dashboard/DashboardHomePage";
import { EmployeeListPage } from "../pages/employees/EmployeeListPage";
import { EmployeeDetailPage } from "../pages/employees/EmployeeDetailPage";
import { EmployeeFormPage } from "../pages/employees/EmployeeFormPage";
import { AttendanceReportPage } from "../pages/attendance/AttendanceReportPage";
import { LateComersReportPage } from "../pages/attendance/LateComersReportPage";
import { AttendanceCorrectionQueuePage } from "../pages/attendance/AttendanceCorrectionQueuePage";
import { LeaveApprovalQueuePage } from "../pages/leave/LeaveApprovalQueuePage";
import { ProductionEntryFormPage } from "../pages/production/ProductionEntryFormPage";
import { ProductionReportPage } from "../pages/production/ProductionReportPage";
import { PayrollGenerationPage } from "../pages/payroll/PayrollGenerationPage";
import { PayrollRecordListPage } from "../pages/payroll/PayrollRecordListPage";
import { PayslipDetailPage } from "../pages/payroll/PayslipDetailPage";
import { DisbursementFilePage } from "../pages/payroll/DisbursementFilePage";
import { ShiftManagementPage } from "../pages/settings/ShiftManagementPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardHomePage />} />

        <Route path="/employees" element={<EmployeeListPage />} />
        <Route path="/employees/new" element={<EmployeeFormPage />} />
        <Route path="/employees/:employeeId" element={<EmployeeDetailPage />} />
        <Route path="/employees/:employeeId/edit" element={<EmployeeFormPage />} />

        <Route path="/attendance" element={<AttendanceReportPage />} />
        <Route path="/attendance/late-comers" element={<LateComersReportPage />} />
        <Route path="/attendance/corrections" element={<AttendanceCorrectionQueuePage />} />

        <Route path="/leave/approvals" element={<LeaveApprovalQueuePage />} />

        <Route path="/production/entry" element={<ProductionEntryFormPage />} />
        <Route path="/production/report" element={<ProductionReportPage />} />

        <Route path="/payroll" element={<PayrollRecordListPage />} />
        <Route path="/payroll/generate" element={<PayrollGenerationPage />} />
        <Route path="/payroll/disbursement" element={<DisbursementFilePage />} />
        <Route path="/payroll/:employeeId/:month/:year" element={<PayslipDetailPage />} />

        <Route path="/settings/shifts" element={<ShiftManagementPage />} />
      </Route>
    </Routes>
  );
}
