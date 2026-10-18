import { describe, expect, it } from 'vitest';

import { getServiceDisplayName, translateOperationalMessage } from './operational-copy';

describe('operational copy', () => {
  it('translates known service incidents into Spanish', () => {
    expect(translateOperationalMessage('transfers unavailable', 'transfers'))
      .toBe('Servicio de transferencias no disponible');
    expect(getServiceDisplayName('transfers')).toBe('Transferencias');
  });

  it('preserves unknown service identifiers while translating the status', () => {
    expect(translateOperationalMessage('payments degraded', 'payments'))
      .toBe('payments degradado');
  });
});
