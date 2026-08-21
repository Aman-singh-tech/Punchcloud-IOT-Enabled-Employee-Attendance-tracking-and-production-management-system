import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  useNotifications,
  useUnreadNotificationCount,
  useNotificationActions,
  AppNotification,
} from "@punchcloud/shared";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: count } = useUnreadNotificationCount();
  const { data: items, isLoading } = useNotifications();
  const { markRead, markAllRead } = useNotificationActions();
  const navigate = useNavigate();

  const unread = count ?? 0;

  const handleClick = async (n: AppNotification) => {
    if (!n.isRead) await markRead(n.notificationId);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60">
            <div className="flex items-center justify-between border-b border-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-800">Notifications</span>
              {unread > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <p className="px-4 py-6 text-center text-xs text-slate-400">Loading...</p>
              ) : !items || items.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-slate-400">Nothing yet</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.notificationId}
                    onClick={() => handleClick(n)}
                    className={`block w-full border-b border-slate-50 px-4 py-3 text-left text-xs last:border-0 hover:bg-slate-50 ${
                      n.isRead ? "text-slate-500" : "bg-primary-light/40 text-slate-800"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      <div className={n.isRead ? "pl-3.5" : ""}>
                        <p>{n.message}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
