import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-primary to-primary-dark text-white shadow-sm shadow-primary/30 hover:shadow-md hover:shadow-primary/40 active:scale-[0.98] disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-[0.98] disabled:text-slate-300",
  danger:
    "bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-[0.98] disabled:text-rose-200",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 active:scale-[0.98]",
};

export function Button({
  variant = "primary",
  icon,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: ReactNode }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
