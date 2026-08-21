import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth, Button } from "@punchcloud/shared";

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
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-primary">PunchCloud Admin</h1>
        <p className="mb-6 text-sm text-gray-500">HR</p>

        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
        <input {...register("email")} type="email" className="mb-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        {errors.email && <p className="mb-2 text-xs text-red-600">{errors.email.message}</p>}

        <label className="mb-1 mt-3 block text-sm font-medium text-gray-700">Password</label>
        <input {...register("password")} type="password" className="mb-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        {errors.password && <p className="mb-2 text-xs text-red-600">{errors.password.message}</p>}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={isSubmitting} className="mt-6 w-full">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
