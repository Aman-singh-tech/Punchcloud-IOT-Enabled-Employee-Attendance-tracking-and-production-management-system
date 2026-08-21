import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

interface ToastMessage {
  id: number;
  text: string;
  variant: "success" | "error" | "info";
}

interface ToastContextValue {
  show: (text: string, variant?: ToastMessage["variant"]) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const STYLES = {
  success: "bg-white text-emerald-700 ring-1 ring-emerald-100",
  error: "bg-white text-rose-700 ring-1 ring-rose-100",
  info: "bg-white text-slate-700 ring-1 ring-slate-100",
};
const ICON_COLOR = { success: "text-emerald-500", error: "text-rose-500", info: "text-slate-400" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const show = useCallback((text: string, variant: ToastMessage["variant"] = "info") => {
    const id = Date.now() + Math.random();
    setMessages((prev) => [...prev, { id, text, variant }]);
    setTimeout(() => setMessages((prev) => prev.filter((m) => m.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed inset-x-4 top-4 z-[100] flex flex-col items-center gap-2">
        {messages.map((m) => {
          const Icon = ICONS[m.variant];
          return (
            <div
              key={m.id}
              className={`animate-in flex w-full max-w-sm items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${STYLES[m.variant]}`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${ICON_COLOR[m.variant]}`} />
              {m.text}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
