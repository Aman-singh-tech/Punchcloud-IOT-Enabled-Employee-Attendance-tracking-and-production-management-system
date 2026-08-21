import { HTMLAttributes, ReactNode } from "react";

export function Card({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-card ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
