import { EmployeeType } from "@punchcloud/shared";

// Frontend doc Section 5: the single UI decision point for onboarding. Selecting
// piece_rate shows only per_record_rate; selecting fixed_salary shows only
// monthly_base_salary. No UI ever shows both, and there is no third option (confirmed:
// none exists).
export function EmployeeTypeToggle({
  value,
  onChange,
}: {
  value: EmployeeType;
  onChange: (value: EmployeeType) => void;
}) {
  return (
    <div className="flex gap-3">
      {(["piece_rate", "fixed_salary"] as EmployeeType[]).map((type) => (
        <label
          key={type}
          className={`flex-1 cursor-pointer rounded-md border px-4 py-3 text-sm font-medium ${
            value === type ? "border-primary bg-blue-50 text-blue-700" : "border-gray-300 text-gray-600"
          }`}
        >
          <input
            type="radio"
            name="employeeType"
            value={type}
            checked={value === type}
            onChange={() => onChange(type)}
            className="mr-2"
          />
          {type === "piece_rate" ? "Piece-Rate" : "Fixed-Salary"}
        </label>
      ))}
    </div>
  );
}
