import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, Table, Button, Column, useToast, leaveApi, Holiday, formatDate } from "@punchcloud/shared";

interface Shift {
  shiftId: number;
  name: string | null;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  standardHours: string;
  weeklyOffDays: number[];
  lateThresholdMinutes: number;
  lateDaysAllowedPerMonth: number;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ShiftManagementPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["shifts"],
    queryFn: () => apiClient.get<Shift[]>("/shifts").then((r) => r.data),
  });

  const [form, setForm] = useState({
    name: "",
    startTime: "09:00",
    endTime: "18:00",
    gracePeriodMinutes: 10,
    lateThresholdMinutes: 15,
    lateDaysAllowedPerMonth: 4,
  });

  const create = useMutation({
    mutationFn: () => apiClient.post("/shifts", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.show("Shift created", "success");
    },
  });

  const columns: Column<Shift>[] = [
    { key: "name", header: "Name", render: (s) => s.name ?? "-" },
    { key: "start", header: "Start", render: (s) => new Date(s.startTime).toISOString().slice(11, 16) },
    { key: "end", header: "End", render: (s) => new Date(s.endTime).toISOString().slice(11, 16) },
    { key: "grace", header: "Grace (min)", render: (s) => s.gracePeriodMinutes },
    { key: "off", header: "Weekly Off", render: (s) => s.weeklyOffDays.map((d) => DAY_LABELS[d]).join(", ") },
    { key: "lateRule", header: "Late Rule", render: (s) => `>${s.lateThresholdMinutes} min late, ${s.lateDaysAllowedPerMonth} free/month` },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Shift Management</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Start Time</label>
          <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">End Time</label>
          <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Grace (min)</label>
          <input type="number" value={form.gracePeriodMinutes} onChange={(e) => setForm({ ...form, gracePeriodMinutes: parseInt(e.target.value, 10) })} className="w-20 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Late after (min)</label>
          <input type="number" value={form.lateThresholdMinutes} onChange={(e) => setForm({ ...form, lateThresholdMinutes: parseInt(e.target.value, 10) })} className="w-20 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Free late days/month</label>
          <input type="number" value={form.lateDaysAllowedPerMonth} onChange={(e) => setForm({ ...form, lateDaysAllowedPerMonth: parseInt(e.target.value, 10) })} className="w-20 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
        </div>
        <Button type="submit" disabled={create.isPending}>Add Shift</Button>
      </form>

      <p className="mb-4 max-w-3xl rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Late rule:</strong> arriving more than <strong>{form.lateThresholdMinutes} minutes</strong> after
        the shift start marks the day late. The first <strong>{form.lateDaysAllowedPerMonth} late days</strong> each
        month are forgiven and stay a full Present — every late day after that becomes a{" "}
        <strong>Half-day</strong>, which is paid as half a day. The count resets on the 1st of each month.
      </p>
      {isLoading ? <p className="text-gray-500">Loading...</p> : <Table columns={columns} rows={data ?? []} />}

      <FestivalHolidays />
    </div>
  );
}

// The company observes exactly two festival holidays a year — Diwali and Holi. Their dates
// move every year, so HR enters them here. Each one is treated exactly like a Sunday:
// excluded from working days, so nobody's salary is reduced for it.
function FestivalHolidays() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["holidays"],
    queryFn: () => leaveApi.listHolidays(),
  });

  const [holidayDate, setHolidayDate] = useState("");
  const [name, setName] = useState("Diwali");

  const add = useMutation({
    mutationFn: () => leaveApi.createHoliday({ holidayDate, name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      setHolidayDate("");
      toast.show("Holiday added — re-run Recalculate for that month", "success");
    },
    onError: () => toast.show("Could not add holiday", "error"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => leaveApi.deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.show("Holiday removed", "success");
    },
  });

  const columns: Column<Holiday>[] = [
    { key: "date", header: "Date", render: (h) => formatDate(h.holidayDate) },
    { key: "day", header: "Day", render: (h) => DAY_LABELS[new Date(h.holidayDate).getUTCDay()] },
    { key: "name", header: "Festival", render: (h) => h.name ?? "-" },
    {
      key: "actions",
      header: "",
      render: (h) => (
        <button
          onClick={() => remove.mutate(h.holidayId)}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Remove
        </button>
      ),
    },
  ];

  return (
    <section className="mt-10">
      <h2 className="mb-1 text-lg font-bold">Festival Holidays</h2>
      <p className="mb-4 max-w-3xl text-sm text-gray-600">
        Diwali aur Holi ki dates har saal badalti hain, isliye yahan add karni padti hain. In
        dino ko system <strong>Sunday jaisa</strong> treat karta hai — office band, aur
        fixed-salary wale ka us din ka paisa <strong>nahi katta</strong>. Date add ya remove
        karne ke baad us mahine ke liye <strong>Attendance → Recalculate</strong> chala dena.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (holidayDate) add.mutate();
        }}
        className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Festival</label>
          <select
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option>Diwali</option>
            <option>Holi</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={holidayDate}
            onChange={(e) => setHolidayDate(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <Button type="submit" disabled={!holidayDate || add.isPending}>
          Add Holiday
        </Button>
      </form>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <Table columns={columns} rows={data ?? []} />
      )}
    </section>
  );
}
