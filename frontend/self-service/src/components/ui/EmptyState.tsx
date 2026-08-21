import { LucideIcon, Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  message,
}: {
  icon?: LucideIcon;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
      </div>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}
