import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useNotifications,
  useUnreadNotificationCount,
  useNotificationActions,
  AppNotification,
} from "@punchcloud/shared";

// No icon library in this app (unlike self-service's Lucide set) — a plain inline SVG bell
// keeps this consistent with the rest of admin-dashboard's plain-Tailwind style.
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
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
              <span className="text-sm font-semibold text-gray-800">Notifications</span>
              {unread > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">Loading...</p>
              ) : !items || items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">No notifications yet</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.notificationId}
                    onClick={() => handleClick(n)}
                    className={`block w-full border-b border-gray-50 px-4 py-3 text-left text-sm last:border-0 hover:bg-gray-50 ${
                      n.isRead ? "text-gray-500" : "bg-blue-50/50 text-gray-800"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />}
                      <div className={n.isRead ? "pl-3.5" : ""}>
                        <p>{n.message}</p>
                        <p className="mt-0.5 text-[11px] text-gray-400">
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
