import { Injectable } from "@nestjs/common";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface PayslipData {
  employeeName: string;
  employeeCode: string;
  designation: string | null;
  month: number;
  year: number;
  employeeType: "piece_rate" | "fixed_salary";
  daysPresent: number | null; // full days only
  daysHalfDay: number | null; // each worth 0.5 of a payable day
  daysLate: number | null;
  daysAbsent: number | null;
  daysOnPaidLeave: number | null;
  daysOnUnpaidLeave: number | null;
  daysOff: number | null;
  workingDays: number | null;
  totalLateMinutes: number | null;
  totalOtMinutes: number | null; // informational only — never part of net_pay, for either type
  totalProduced: number | null;
  totalAccepted: number | null;
  totalRejected: number | null;
  netPay: number;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// No gross-to-net breakdown: net_pay is the single final figure shown (Formulas doc
// Section 5 / frontend doc Section 5) — there is nothing to itemize since there are no
// deductions, and overtime is not paid to either employee type.
@Injectable()
export class PayslipPdfService {
  async render(data: PayslipData): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]); // A4
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const left = 50;
    const draw = (
      text: string,
      opts: { size?: number; f?: typeof font; color?: [number, number, number] } = {},
    ) => {
      page.drawText(text, {
        x: left,
        y,
        size: opts.size ?? 11,
        font: opts.f ?? font,
        color: rgb(...(opts.color ?? [0.1, 0.1, 0.1])),
      });
      y -= (opts.size ?? 11) + 8;
    };

    draw("PunchCloud — Payslip", { size: 20, f: bold });
    draw(`${MONTH_NAMES[data.month - 1]} ${data.year}`, { size: 13, color: [0.3, 0.3, 0.3] });
    y -= 10;

    draw(`Employee: ${data.employeeName} (${data.employeeCode})`, { f: bold });
    if (data.designation) draw(`Designation: ${data.designation}`);
    draw(`Pay type: ${data.employeeType === "piece_rate" ? "Piece-Rate" : "Fixed-Salary"}`);
    y -= 10;

    const isFixed = data.employeeType === "fixed_salary";

    draw("Attendance Summary", { f: bold, size: 13 });
    draw(`Days Present: ${data.daysPresent ?? "-"}    Days Absent: ${data.daysAbsent ?? "-"}`);
    draw(
      `Half-days: ${data.daysHalfDay ?? 0}  (each counts as 0.5 day)    Late arrivals: ${data.daysLate ?? 0}`,
    );
    // No paid leave exists at this company — leave days are shown for the record, but a
    // leave day is simply not a present day and is therefore not paid.
    draw(
      `Days on Leave: ${(data.daysOnPaidLeave ?? 0) + (data.daysOnUnpaidLeave ?? 0)}  (not paid)`,
    );
    draw(`Weekly Off Days: ${data.daysOff ?? 0}`);
    if (isFixed && data.workingDays !== null) {
      draw(`Working Days this month: ${data.workingDays}`);
    }
    draw(`Total Late Minutes: ${data.totalLateMinutes ?? 0}`);
    // Recorded for HR's records for both employee types, but never converted into money.
    draw(`Total OT Minutes: ${data.totalOtMinutes ?? 0}  (recorded only — not paid)`, {
      color: [0.5, 0.5, 0.5],
    });
    y -= 10;

    if (data.employeeType === "piece_rate") {
      draw("Production Summary", { f: bold, size: 13 });
      draw(`Records Produced: ${data.totalProduced ?? 0}`);
      draw(`Records Accepted: ${data.totalAccepted ?? 0}`);
      draw(`Records Rejected: ${data.totalRejected ?? 0}`);
      y -= 10;
    }

    draw("Net Pay", { f: bold, size: 14 });
    draw(`Rs. ${data.netPay.toFixed(2)}`, { f: bold, size: 22 });

    const bytes = await doc.save();
    return Buffer.from(bytes);
  }
}
