import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@punchcloud/shared";
import { EmployeeLayout } from "../layouts/EmployeeLayout";
import { LoginPage } from "../pages/auth/LoginPage";
import { HomePage } from "../pages/home/HomePage";
import { MyAttendancePage } from "../pages/attendance/MyAttendancePage";
import { ApplyLeavePage } from "../pages/leave/ApplyLeavePage";
import { MyLeaveBalancePage } from "../pages/leave/MyLeaveBalancePage";
import { MyLeaveRequestsPage } from "../pages/leave/MyLeaveRequestsPage";
import { MyPayslipsPage } from "../pages/payslips/MyPayslipsPage";
import { PayslipDetailPage } from "../pages/payslips/PayslipDetailPage";
import { MyProductionPage } from "../pages/production/MyProductionPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/attendance" element={<MyAttendancePage />} />
        <Route path="/leave/apply" element={<ApplyLeavePage />} />
        <Route path="/leave/balance" element={<MyLeaveBalancePage />} />
        <Route path="/leave/requests" element={<MyLeaveRequestsPage />} />
        <Route path="/payslips" element={<MyPayslipsPage />} />
        <Route path="/payslips/:month/:year" element={<PayslipDetailPage />} />
        <Route path="/production" element={<MyProductionPage />} />
      </Route>
    </Routes>
  );
}
