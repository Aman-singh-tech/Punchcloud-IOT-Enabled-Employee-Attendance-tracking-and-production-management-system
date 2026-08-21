export interface ProductionEntry {
  entryId: string;
  employeeId: number;
  entryDate: string;
  recordsProduced: number;
  recordsAccepted: number;
  recordsRejected: number;
  rejectionReason: string | null;
  submittedBy: number | null;
  submittedAt: string;
}
