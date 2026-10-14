import { z } from 'zod';

export const loginSchema = z.object({
  corporateEmail: z.email('Ingresa un correo corporativo válido').trim(),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export type LoginValues = z.infer<typeof loginSchema>;
