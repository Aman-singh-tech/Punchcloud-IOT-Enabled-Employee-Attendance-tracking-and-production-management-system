import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@punchcloud/shared";
import { Fingerprint, Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await login(values.email, values.password);
      navigate("/");
    } catch {
      setError("Invalid email or password");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-light via-slate-50 to-slate-50 px-5">
      <div className="w-full max-w-sm animate-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/30">
            <Fingerprint className="h-7 w-7 text-white" strokeWidth={1.75} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">PunchCloud</h1>
          <p className="mt-1 text-sm text-slate-500">Attendance, leave &amp; payslips</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card"
        >
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                {...register("email")}
                type="email"
                placeholder="you@company.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {errors.email && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle className="h-3 w-3" /> {errors.email.message}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {errors.password && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle className="h-3 w-3" /> {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
