import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Employee, useToast } from "@punchcloud/shared";
import { useSubmitProductionEntry } from "../features/production/useProductionEntry";

const schema = z
  .object({
    employeeId: z.coerce.number().min(1, "Select an employee"),
    entryDate: z.string().min(1),
    recordsProduced: z.coerce.number().min(0),
    recordsAccepted: z.coerce.number().min(0),
    recordsRejected: z.coerce.number().min(0),
    rejectionReason: z.string().optional(),
  })
  .refine((v) => v.recordsAccepted + v.recordsRejected <= v.recordsProduced, {
    message: "Accepted + Rejected cannot exceed Produced",
    path: ["recordsAccepted"],
  });
type FormValues = z.infer<typeof schema>;

export function ProductionEntryForm({ employees }: { employees: Employee[] }) {
  const toast = useToast();
  const submit = useSubmitProductionEntry();
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { entryDate: new Date().toISOString().slice(0, 10) },
  });

  const piceRateEmployees = employees.filter((e) => e.salaryStructures?.some((s) => s.employeeType === "piece_rate" && !s.effectiveTo)) ;
  const options = piceRateEmployees.length > 0 ? piceRateEmployees : employees;

  async function onSubmit(values: FormValues) {
    try {
      await submit.mutateAsync(values);
      setLastSubmitted(`Saved: ${values.recordsAccepted}/${values.recordsProduced} accepted`);
      toast.show("Production entry saved", "success");
      reset({ ...values, recordsProduced: 0, recordsAccepted: 0, recordsRejected: 0, rejectionReason: "" });
    } catch {
      toast.show("Failed to save entry", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-lg border border-gray-200 bg-white p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Employee</label>
        <select {...register("employeeId")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="">Select employee...</option>
          {options.map((e) => (
            <option key={e.employeeId} value={e.employeeId}>
              {e.employeeCode} — {e.name}
            </option>
          ))}
        </select>
        {errors.employeeId && <p className="text-xs text-red-600">{errors.employeeId.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
        <input type="date" {...register("entryDate")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Produced</label>
          <input type="number" min={0} {...register("recordsProduced")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Accepted</label>
          <input type="number" min={0} {...register("recordsAccepted")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Rejected</label>
          <input type="number" min={0} {...register("recordsRejected")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>
      {errors.recordsAccepted && <p className="text-xs text-red-600">{errors.recordsAccepted.message}</p>}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Rejection Reason (optional)</label>
        <input {...register("rejectionReason")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving..." : "Submit Entry"}
      </Button>
      {lastSubmitted && <p className="text-xs text-gray-500">{lastSubmitted}</p>}
    </form>
  );
}
