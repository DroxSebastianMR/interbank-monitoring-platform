import { useState, type FormEvent } from 'react';
import type { ServiceConfigInput } from '@/features/services/types/service.types';

const initialValue: ServiceConfigInput = {
  code: '',
  name: '',
  endpoint: '',
  criticality: 'HIGH',
};

interface CreateServiceFormProps {
  isPending: boolean;
  isError: boolean;
  onSubmit: (input: ServiceConfigInput) => void;
}

export function CreateServiceForm({ isPending, isError, onSubmit }: CreateServiceFormProps) {
  const [form, setForm] = useState<ServiceConfigInput>(initialValue);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <form className="table-card service-form" onSubmit={handleSubmit}>
      <h3>Nuevo servicio supervisado</h3>
      <p>El destino se limita a una ruta health relativa del backend bancario configurado.</p>
      <label>
        Código
        <input required pattern="[a-z][a-z0-9-]{1,59}" value={form.code}
          onChange={(event) => setForm({ ...form, code: event.target.value })} />
      </label>
      <label>
        Nombre
        <input required maxLength={120} value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })} />
      </label>
      <label>
        Ruta de salud
        <input required placeholder="/auth/health" value={form.endpoint}
          onChange={(event) => setForm({ ...form, endpoint: event.target.value })} />
      </label>
      <label>
        Criticidad
        <select value={form.criticality}
          onChange={(event) => setForm({ ...form, criticality: event.target.value as ServiceConfigInput['criticality'] })}>
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      {isError && <p role="alert" className="form-error">
        No se pudo registrar el servicio. Comprueba el código y el destino.
      </p>}
      <button disabled={isPending}>Guardar servicio</button>
    </form>
  );
}
