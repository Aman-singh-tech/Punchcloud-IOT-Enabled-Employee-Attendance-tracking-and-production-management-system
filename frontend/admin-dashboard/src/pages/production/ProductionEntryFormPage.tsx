import { useEmployees } from "../../features/employees/useEmployees";
import { ProductionEntryForm } from "../../components/ProductionEntryForm";

export function ProductionEntryFormPage() {
  const { data: employees } = useEmployees();
  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-xl font-bold">Daily Production Entry</h1>
      <ProductionEntryForm employees={employees ?? []} />
    </div>
  );
}
