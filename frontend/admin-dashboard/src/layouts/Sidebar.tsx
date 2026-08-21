import { NavLink } from "react-router-dom";
import { Role } from "@punchcloud/shared";

interface NavItem {
  label: string;
  to: string;
  roles: Role[];
}

// Client-requested change: a single HR person handles literally everything here —
// employees, production entry, attendance, payroll, disbursement, and shift setup — no
// separate Admin, Supervisor, or Finance role exists. The `roles` field/filtering is kept
// (rather than dropped) so a future client that wants role separation back is a small
// change, not a rewrite.
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", roles: ["HR"] },
  { label: "Employees", to: "/employees", roles: ["HR"] },
  { label: "Attendance", to: "/attendance", roles: ["HR"] },
  { label: "Late Comers", to: "/attendance/late-comers", roles: ["HR"] },
  { label: "Leave Approvals", to: "/leave/approvals", roles: ["HR"] },
  { label: "Production Entry", to: "/production/entry", roles: ["HR"] },
  { label: "Production Report", to: "/production/report", roles: ["HR"] },
  { label: "Payroll Records", to: "/payroll", roles: ["HR"] },
  { label: "Generate Payroll", to: "/payroll/generate", roles: ["HR"] },
  { label: "Disbursement File", to: "/payroll/disbursement", roles: ["HR"] },
  { label: "Shifts", to: "/settings/shifts", roles: ["HR"] },
];

export function Sidebar({ role }: { role: Role }) {
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));
  return (
    <nav className="flex h-full w-60 flex-col gap-1 border-r border-gray-200 bg-white p-4">
      <div className="mb-4 px-2 text-lg font-bold text-primary">PunchCloud</div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `rounded-md px-3 py-2 text-sm font-medium ${
              isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
