import { Link } from "react-router-dom";
import { Table, Button, StatusBadge, Column, Employee } from "@punchcloud/shared";
import { useEmployees } from "../../features/employees/useEmployees";

export function EmployeeListPage() {
  const { data, isLoading } = useEmployees();

  const columns: Column<Employee>[] = [
    { key: "code", header: "Code", render: (e) => e.employeeCode },
    { key: "name", header: "Name", render: (e) => <Link to={`/employees/${e.employeeId}`} className="text-primary hover:underline">{e.name}</Link> },
    { key: "designation", header: "Designation", render: (e) => e.designation ?? "-" },
    { key: "status", header: "Status", render: (e) => <StatusBadge status={e.status} /> },
    { key: "actions", header: "", render: (e) => <Link to={`/employees/${e.employeeId}/edit`} className="text-sm text-primary hover:underline">Edit</Link> },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Employees</h1>
        <Link to="/employees/new">
          <Button>+ New Employee</Button>
        </Link>
      </div>
      {isLoading ? <p className="text-gray-500">Loading...</p> : <Table columns={columns} rows={data ?? []} />}
    </div>
  );
}
