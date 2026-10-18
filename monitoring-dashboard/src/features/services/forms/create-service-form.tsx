import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/heroui-button';
import { Input } from '@/components/ui/heroui-input';
import { Label, ListBox, Select } from '@/components/ui/heroui-select';
import { CRITICALITY_LABELS, CRITICALITY_OPTIONS } from '@/features/services/constants/service.constants';
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
    <form className="service-form" onSubmit={handleSubmit}>
      <div className="service-form-field">
        <label htmlFor="service-code">Código</label>
        <Input id="service-code" className="service-form-input" variant="secondary"
          required pattern="[a-z][a-z0-9-]{1,59}" value={form.code}
          onChange={(event) => setForm({ ...form, code: event.target.value })} />
      </div>
      <div className="service-form-field">
        <label htmlFor="service-name">Nombre</label>
        <Input id="service-name" className="service-form-input" variant="secondary"
          required maxLength={120} value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })} />
      </div>
      <div className="service-form-field">
        <label htmlFor="service-endpoint">Ruta de salud</label>
        <Input id="service-endpoint" className="service-form-input" variant="secondary"
          required placeholder="/auth/health" value={form.endpoint}
          onChange={(event) => setForm({ ...form, endpoint: event.target.value })} />
      </div>
      <Select
        className="service-form-field service-form-select"
        selectedKey={form.criticality}
        onSelectionChange={(key) => {
          if (key != null) setForm({ ...form, criticality: String(key) as ServiceConfigInput['criticality'] });
        }}
      >
        <Label>Criticidad</Label>
        <Select.Trigger className="service-form-select-trigger">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {CRITICALITY_OPTIONS.map((value) => (
              <ListBox.Item key={value} id={value} textValue={value}>
                <Label>{CRITICALITY_LABELS[value]}</Label>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      {isError && <p role="alert" className="form-error">
        No se pudo registrar el servicio. Comprueba el código y el destino.
      </p>}
      <Button className="service-form-submit" type="submit" variant="primary" isDisabled={isPending}>
        {isPending ? 'Guardando…' : 'Guardar servicio'}
      </Button>
    </form>
  );
}
