import { Outlet } from "react-router-dom";
import { useAuth, Button } from "@punchcloud/shared";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "../components/NotificationBell";

export function DashboardLayout() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="flex h-screen">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div className="text-sm text-gray-500">
            Signed in as <span className="font-medium text-gray-800">{user.email}</span> ({user.role})
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="secondary" onClick={logout}>
              Log out
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
