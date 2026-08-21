import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Modal, StatusBadge, formatCurrency, formatDate, useToast } from "@punchcloud/shared";
import { useEmployee, useResetPassword } from "../../features/employees/useEmployees";

export function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const { data: employee, isLoading } = useEmployee(employeeId ? parseInt(employeeId, 10) : undefined);
  const resetPassword = useResetPassword();
  const toast = useToast();
  const [newLogin, setNewLogin] = useState<{ email: string; password: string } | null>(null);

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!employee) return <p className="text-gray-500">Employee not found</p>;

  const activeSalary = employee.salaryStructures?.find((s) => !s.effectiveTo);

  async function handleResetPassword() {
    try {
      const result = await resetPassword.mutateAsync(employee!.employeeId);
      setNewLogin({ email: result.loginEmail, password: result.temporaryPassword });
    } catch {
      toast.show("No login account exists for this employee, or the reset failed", "error");
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{employee.name}</h1>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleResetPassword} disabled={resetPassword.isPending}>
            {resetPassword.isPending ? "Resetting..." : "Reset Password"}
          </Button>
          <Link to={`/employees/${employee.employeeId}/edit`} className="text-sm text-primary hover:underline">
            Edit
          </Link>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-gray-500">Code</dt><dd>{employee.employeeCode}</dd></div>
          <div><dt className="text-gray-500">Designation</dt><dd>{employee.designation ?? "-"}</dd></div>
          <div><dt className="text-gray-500">Status</dt><dd><StatusBadge status={employee.status} /></dd></div>
          <div><dt className="text-gray-500">Device ID</dt><dd>{employee.deviceEnrollmentId ?? "-"}</dd></div>
          <div><dt className="text-gray-500">Date of Joining</dt><dd>{formatDate(employee.dateOfJoining)}</dd></div>
        </dl>
      </div>

      <h2 className="mb-2 text-sm font-semibold text-gray-700">Salary Structure</h2>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Rate</th>
              <th className="px-3 py-2 text-left">Effective From</th>
              <th className="px-3 py-2 text-left">Effective To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(employee.salaryStructures ?? []).map((s) => (
              <tr key={s.salaryStructureId} className={s === activeSalary ? "bg-blue-50" : ""}>
                <td className="px-3 py-2">{s.employeeType === "piece_rate" ? "Piece-Rate" : "Fixed-Salary"}</td>
                <td className="px-3 py-2">
                  {s.employeeType === "piece_rate"
                    ? `${formatCurrency(s.perRecordRate ?? 0)}/record`
                    : `${formatCurrency(s.monthlyBaseSalary ?? 0)}/month`}
                </td>
                <td className="px-3 py-2">{formatDate(s.effectiveFrom)}</td>
                <td className="px-3 py-2">{s.effectiveTo ? formatDate(s.effectiveTo) : "Current"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!newLogin} onClose={() => setNewLogin(null)} title="Password reset">
        {newLogin && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Share this new password with the employee directly. It will not be shown again.
            </p>
            <div className="rounded-md bg-gray-50 p-3 font-mono text-sm">
              <div>Email: {newLogin.email}</div>
              <div>New Password: {newLogin.password}</div>
            </div>
            <Button className="w-full" onClick={() => setNewLogin(null)}>
              Done
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
