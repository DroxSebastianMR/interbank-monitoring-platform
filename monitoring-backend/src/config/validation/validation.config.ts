import { ValidationPipe } from '@nestjs/common';

import { GLOBAL_VALIDATION_OPTIONS } from '@/config/validation/validation.constants';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe(GLOBAL_VALIDATION_OPTIONS);
}
