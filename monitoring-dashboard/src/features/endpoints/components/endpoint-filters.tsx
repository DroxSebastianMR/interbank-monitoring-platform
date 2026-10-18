import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EndpointFilters as Filters } from "@/features/endpoints/types/endpoint.types";
import { ALL_ENDPOINTS } from "@/features/endpoints/utils/endpoint-metrics";

interface Props {
  value: Filters;
  instances: string[];
  modules: string[];
  methods: string[];
  onChange: (filters: Filters) => void;
}

export function EndpointFilters({
  value,
  instances,
  modules,
  methods,
  onChange,
}: Props) {
  const fields = [
    { key: "instance", label: "Instancia", options: instances },
    { key: "module", label: "Módulo", options: modules },
    { key: "method", label: "Método", options: methods },
  ] as const;
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
      {fields.map(({ key, label, options }) => (
        <div key={key} className="space-y-1.5">
          <span
            id={`endpoint-${key}`}
            className="text-xs font-semibold text-slate-600"
          >
            {label}
          </span>
          <Select
            value={value[key]}
            onValueChange={(selected) =>
              onChange({ ...value, [key]: selected })
            }
          >
            <SelectTrigger
              aria-labelledby={`endpoint-${key}`}
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ENDPOINTS}>Todos</SelectItem>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      <label className="space-y-1.5 text-xs font-semibold text-slate-600">
        Buscar ruta o módulo
        <Input
          className="mt-1.5"
          value={value.search}
          maxLength={150}
          onChange={(event) =>
            onChange({ ...value, search: event.target.value })
          }
          placeholder="Ej.: auth, préstamos, /transfers"
        />
      </label>
    </div>
  );
}
