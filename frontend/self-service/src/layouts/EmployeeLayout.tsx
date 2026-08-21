import { NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth, employeeApi } from "@punchcloud/shared";
import { Home, CalendarDays, Wallet, Package, CalendarCheck, FileWarning, LogOut, Fingerprint } from "lucide-react";
import { NotificationBell } from "../components/NotificationBell";

const NAV_ITEMS = [
  { label: "Home", to: "/", icon: Home },
  { label: "Attendance", to: "/attendance", icon: CalendarDays },
  { label: "Leave", to: "/leave/requests", icon: CalendarCheck },
  { label: "Payslips", to: "/payslips", icon: Wallet },
  { label: "Corrections", to: "/corrections/status", icon: FileWarning },
];

export function EmployeeLayout() {
  const { user, logout } = useAuth();
  const { data: employee } = useQuery({
    queryKey: ["myEmployee", user?.employeeId],
    queryFn: () => employeeApi.get(user!.employeeId!),
    enabled: !!user?.employeeId,
  });

  const isPieceRate = employee?.salaryStructures?.some(
    (s) => s.employeeType === "piece_rate" && !s.effectiveTo,
  );

  // ProductionSummaryCard / MyProductionPage only render for piece-rate employees — a
  // fixed-salary employee's self-service view has no production tab at all
  // (frontend doc Section 5).
  const navItems = isPieceRate
    ? [...NAV_ITEMS.slice(0, 4), { label: "Production", to: "/production", icon: Package }, NAV_ITEMS[4]]
    : NAV_ITEMS;

  if (!user) return null;

  const initials = (user.employeeName ?? user.email).slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark">
            <Fingerprint className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="text-sm font-bold text-slate-900">PunchCloud</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
            {initials}
          </div>
          <button
            onClick={logout}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-100 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto flex max-w-md justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors ${
                    isActive ? "text-primary" : "text-slate-400 hover:text-slate-600"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        isActive ? "bg-primary-light" : ""
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.25 : 1.75} />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
