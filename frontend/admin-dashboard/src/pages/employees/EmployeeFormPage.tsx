import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Modal, useToast, EmployeeType, apiClient } from "@punchcloud/shared";
import { useCreateEmployee, useEmployee, useUpdateEmployee } from "../../features/employees/useEmployees";
import { useChangeSalaryStructure } from "../../features/employees/useSalaryStructure";
import { EmployeeTypeToggle } from "../../components/EmployeeTypeToggle";

interface ShiftOption {
  shiftId: number;
  name: string | null;
  startTime: string;
  endTime: string;
}

// email is only rendered (and required) on create — the field is hidden entirely in edit
// mode (an existing employee's login email isn't editable here). The schema has to match:
// requiring it unconditionally made every edit-save silently fail validation on a field
// the user couldn't even see, with no visible error.
function buildSchema(isEdit: boolean) {
  return z
    .object({
      employeeCode: z.string().min(1),
      email: isEdit ? z.string().optional() : z.string().email("Enter a valid email"),
      name: z.string().min(1),
      designation: z.string().optional(),
      deviceEnrollmentId: z.string().optional(),
      dateOfJoining: z.string().optional(),
      // Required: without a shift, late-arrival and half-day detection silently never fire
      // for this employee (found live 2026-08-21 — a real employee created through this
      // exact form had isLate stuck at false no matter how late they punched in).
      shiftId: z.coerce.number({ invalid_type_error: "Select a shift" }).min(1, "Select a shift"),
      employeeType: z.enum(["piece_rate", "fixed_salary"]),
      monthlyBaseSalary: z.coerce.number().optional(),
      perRecordRate: z.coerce.number().optional(),
      effectiveFrom: z.string().min(1, "Effective from date is required"),
    })
    .refine((v) => (v.employeeType === "fixed_salary" ? !!v.monthlyBaseSalary : true), {
      message: "Monthly base salary is required for fixed-salary employees",
      path: ["monthlyBaseSalary"],
    })
    .refine((v) => (v.employeeType === "piece_rate" ? !!v.perRecordRate : true), {
      message: "Per-record rate is required for piece-rate employees",
      path: ["perRecordRate"],
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export function EmployeeFormPage() {
  const { employeeId } = useParams();
  const isEdit = !!employeeId;
  const navigate = useNavigate();
  const toast = useToast();
  const { data: existing } = useEmployee(employeeId ? parseInt(employeeId, 10) : undefined);
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const changeSalaryStructure = useChangeSalaryStructure();
  const [employeeType, setEmployeeType] = useState<EmployeeType>("piece_rate");
  const [newLogin, setNewLogin] = useState<{ email: string; password: string } | null>(null);
  const schema = useMemo(() => buildSchema(isEdit), [isEdit]);

  const { data: shifts } = useQuery({
    queryKey: ["shifts"],
    queryFn: () => apiClient.get<ShiftOption[]>("/shifts").then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { employeeType: "piece_rate", effectiveFrom: new Date().toISOString().slice(0, 10) },
    values: existing
      ? {
          employeeCode: existing.employeeCode,
          email: "",
          name: existing.name,
          designation: existing.designation ?? "",
          deviceEnrollmentId: existing.deviceEnrollmentId ?? "",
          dateOfJoining: existing.dateOfJoining?.slice(0, 10) ?? "",
          // 0 rather than undefined: an existing employee saved before this field existed
          // has no shift at all — surfacing that as an invalid selection (rather than
          // silently treating it as "fine") is exactly the point of this fix.
          shiftId: existing.shiftId ?? 0,
          employeeType: existing.salaryStructures?.[0]?.employeeType ?? "piece_rate",
          monthlyBaseSalary: existing.salaryStructures?.[0]?.monthlyBaseSalary ?? undefined,
          perRecordRate: existing.salaryStructures?.[0]?.perRecordRate ?? undefined,
          effectiveFrom: new Date().toISOString().slice(0, 10),
        }
      : undefined,
  });

  // Most companies here run a single shift — pre-select it on a NEW employee so HR isn't
  // forced to make a choice that, in practice, only ever has one right answer. Still fully
  // visible/changeable, and existing employees (values.shiftId already set above) are left
  // alone.
  useEffect(() => {
    if (!isEdit && shifts?.length === 1) {
      setValue("shiftId", shifts[0].shiftId);
    }
  }, [isEdit, shifts, setValue]);

  // The `employeeType` local state drives which rate field is *displayed* (EmployeeTypeToggle
  // + the conditional Monthly Salary/Per-Record Rate input below); RHF's `values` prop above
  // keeps the actual form field in sync with `existing`, but that alone doesn't update this
  // separate piece of UI state — without this, editing a fixed-salary employee silently
  // showed (and would have submitted) the piece-rate field instead.
  useEffect(() => {
    if (existing) {
      setEmployeeType(existing.salaryStructures?.[0]?.employeeType ?? "piece_rate");
    }
  }, [existing]);

  async function onSubmit(values: FormValues) {
    const salaryStructure = {
      employeeType: values.employeeType,
      monthlyBaseSalary: values.employeeType === "fixed_salary" ? values.monthlyBaseSalary : undefined,
      perRecordRate: values.employeeType === "piece_rate" ? values.perRecordRate : undefined,
      effectiveFrom: values.effectiveFrom,
    };

    try {
      if (isEdit && existing) {
        await updateEmployee.mutateAsync({
          employeeId: existing.employeeId,
          input: {
            name: values.name,
            designation: values.designation,
            deviceEnrollmentId: values.deviceEnrollmentId,
            shiftId: values.shiftId,
          },
        });
        await changeSalaryStructure.mutateAsync({ employeeId: existing.employeeId, input: salaryStructure });
        toast.show("Employee saved", "success");
        navigate("/employees");
      } else {
        // Guaranteed non-empty here: buildSchema(false) (the create-mode schema) requires
        // a valid email, so zod would have already blocked submission otherwise.
        const result = await createEmployee.mutateAsync({
          employeeCode: values.employeeCode,
          email: values.email!,
          name: values.name,
          designation: values.designation,
          deviceEnrollmentId: values.deviceEnrollmentId,
          dateOfJoining: values.dateOfJoining,
          shiftId: values.shiftId,
          salaryStructure,
        });
        toast.show("Employee created", "success");
        // Show the auto-generated login exactly once — it can't be retrieved again after
        // this (only its bcrypt hash is persisted). HR relays it to the employee directly.
        setNewLogin({ email: result.loginEmail, password: result.temporaryPassword });
      }
    } catch (err) {
      // Surface the backend's actual message (e.g. "Device Enrollment ID already in use")
      // instead of a generic failure — a silent/generic error here is exactly what made
      // the earlier duplicate-device-ID bug hard to diagnose from the UI.
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to save employee";
      toast.show(message, "error");
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-4 text-xl font-bold">{isEdit ? "Edit Employee" : "New Employee"}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Employee Code</label>
          <input {...register("employeeCode")} disabled={isEdit} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100" />
          {errors.employeeCode && <p className="text-xs text-red-600">{errors.employeeCode.message}</p>}
        </div>
        {!isEdit && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Login Email</label>
            <input type="email" {...register("email")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            <p className="mt-1 text-xs text-gray-500">Used to create this employee's self-service login. A temporary password is generated automatically.</p>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input {...register("name")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Designation</label>
          <input {...register("designation")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Device Enrollment ID</label>
          <input {...register("deviceEnrollmentId")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Shift</label>
          <select {...register("shiftId")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select a shift...</option>
            {(shifts ?? []).map((s) => (
              <option key={s.shiftId} value={s.shiftId}>
                {s.name ?? `Shift ${s.shiftId}`} ({new Date(s.startTime).toISOString().slice(11, 16)}–
                {new Date(s.endTime).toISOString().slice(11, 16)})
              </option>
            ))}
          </select>
          {errors.shiftId && <p className="text-xs text-red-600">{errors.shiftId.message}</p>}
          <p className="mt-1 text-xs text-gray-500">
            Determines this employee's working hours, late-arrival threshold, and weekly off day.
          </p>
        </div>
        {!isEdit && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date of Joining</label>
            <input type="date" {...register("dateOfJoining")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
        )}

        <hr />

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Pay Type</label>
          <EmployeeTypeToggle
            value={employeeType}
            onChange={(v) => {
              setEmployeeType(v);
              setValue("employeeType", v);
            }}
          />
        </div>

        {employeeType === "fixed_salary" ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Monthly Base Salary (Rs.)</label>
            <input type="number" step="0.01" {...register("monthlyBaseSalary")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            {errors.monthlyBaseSalary && <p className="text-xs text-red-600">{errors.monthlyBaseSalary.message}</p>}
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Per-Record Rate (Rs.)</label>
            <input type="number" step="0.01" {...register("perRecordRate")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            {errors.perRecordRate && <p className="text-xs text-red-600">{errors.perRecordRate.message}</p>}
          </div>
        )}

        {isEdit && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Effective From</label>
            <input type="date" {...register("effectiveFrom")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <p className="mt-1 text-xs text-gray-500">Changing pay type/rate closes the current structure and starts a new one from this date; past payroll is unaffected.</p>
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Saving..." : "Save Employee"}
        </Button>
      </form>

      <Modal
        open={!!newLogin}
        onClose={() => {
          setNewLogin(null);
          navigate("/employees");
        }}
        title="Employee login created"
      >
        {newLogin && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Share these credentials with the employee directly (e.g. WhatsApp, printed slip).
              This password will not be shown again — if lost, use "Reset Password" on the
              employee's detail page to generate a new one.
            </p>
            <div className="rounded-md bg-gray-50 p-3 font-mono text-sm">
              <div>Email: {newLogin.email}</div>
              <div>Password: {newLogin.password}</div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setNewLogin(null);
                navigate("/employees");
              }}
            >
              Done
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
