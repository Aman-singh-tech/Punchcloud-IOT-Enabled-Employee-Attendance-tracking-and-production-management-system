import { createContext, ReactNode, useCallback, useContext, useState } from "react";

interface ToastMessage {
  id: number;
  text: string;
  variant: "success" | "error" | "info";
}

interface ToastContextValue {
  show: (text: string, variant?: ToastMessage["variant"]) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const show = useCallback((text: string, variant: ToastMessage["variant"] = "info") => {
    const id = Date.now() + Math.random();
    setMessages((prev) => [...prev, { id, text, variant }]);
    setTimeout(() => setMessages((prev) => prev.filter((m) => m.id !== id)), 4000);
  }, []);

  const colors: Record<ToastMessage["variant"], string> = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-gray-800",
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {messages.map((m) => (
          <div key={m.id} className={`rounded-md px-4 py-2 text-sm text-white shadow-lg ${colors[m.variant]}`}>
            {m.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
