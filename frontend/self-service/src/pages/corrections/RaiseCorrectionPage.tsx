import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileWarning, AlertCircle } from "lucide-react";
import { useRaiseCorrection } from "../../features/corrections/useCorrectionRequest";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useToast } from "../../components/ui/Toast";

const schema = z.object({
  requestType: z.enum(["missed_punch", "wrong_attendance", "production_dispute"]),
  targetDate: z.string().min(1),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export function RaiseCorrectionPage() {
  const raise = useRaiseCorrection();
  const toast = useToast();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { requestType: "missed_punch" } });

  async function onSubmit(values: FormValues) {
    try {
      await raise.mutateAsync(values);
      toast.show("Correction request submitted", "success");
      navigate("/corrections/status");
    } catch {
      toast.show("Failed to submit request", "error");
    }
  }

  return (
    <div className="animate-in max-w-md space-y-4">
      <div className="flex items-center gap-2">
        <FileWarning className="h-5 w-5 text-amber-500" />
        <h1 className="text-xl font-bold text-slate-900">Raise a Correction</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={labelClass}>Type</label>
            <select {...register("requestType")} className={inputClass}>
              <option value="missed_punch">Missed Punch</option>
              <option value="wrong_attendance">Wrong Attendance</option>
              <option value="production_dispute">Production Dispute</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" {...register("targetDate")} className={inputClass} />
            {errors.targetDate && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle className="h-3 w-3" /> {errors.targetDate.message}
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              {...register("description")}
              rows={3}
              className={inputClass}
              placeholder="e.g. Forgot to punch out on this date"
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
