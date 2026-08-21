import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarPlus, Info } from "lucide-react";
import { useLeaveTypes, useSubmitLeave } from "../../features/leave/useLeaveApplication";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useToast } from "../../components/ui/Toast";

const schema = z.object({
  leaveTypeId: z.coerce.number().min(1),
  fromDate: z.string().min(1),
  toDate: z.string().min(1),
  reason: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

// Client-confirmed 2026-08-21: this company gives no paid leave at all, so the form no
// longer offers Paid/Sick/Casual/Comp-off as choices — there is nothing for an employee to
// pick between. Every request is silently filed as "Unpaid"; the field isn't rendered.
export function ApplyLeavePage() {
  const { data: leaveTypes } = useLeaveTypes();
  const submitLeave = useSubmitLeave();
  const toast = useToast();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const unpaidType = leaveTypes?.find((lt) => lt.name.toLowerCase() === "unpaid");

  useEffect(() => {
    if (unpaidType) setValue("leaveTypeId", unpaidType.leaveTypeId);
  }, [unpaidType, setValue]);

  async function onSubmit(values: FormValues) {
    try {
      await submitLeave.mutateAsync(values);
      toast.show("Leave request submitted", "success");
      navigate("/leave/requests");
    } catch {
      toast.show("Failed to submit leave request", "error");
    }
  }

  return (
    <div className="animate-in max-w-md space-y-4">
      <div className="flex items-center gap-2">
        <CalendarPlus className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-slate-900">Apply for Leave</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("leaveTypeId")} />

          <div className="flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-xs text-sky-700">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>All leave at this company is unpaid — there's no type to choose.</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>From</label>
              <input type="date" {...register("fromDate")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>To</label>
              <input type="date" {...register("toDate")} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Reason (optional)</label>
            <textarea {...register("reason")} className={inputClass} rows={3} />
          </div>
          <Button type="submit" disabled={isSubmitting || !unpaidType} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
