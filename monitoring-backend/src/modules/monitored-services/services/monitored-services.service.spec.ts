import { BadRequestException, ConflictException } from '@nestjs/common';

import { MonitoredServicesService } from '@/modules/monitored-services/services/monitored-services.service';

describe('MonitoredServicesService', () => {
  it('keeps the configured backend boundary for health targets', () => {
    const service = new MonitoredServicesService();
    expect(service.validateTarget('/auth/health')).toEqual({
      valid: true,
      endpoint: '/auth/health',
    });
    expect(() => service.validateTarget('http://169.254.169.254/latest/meta-data')).toThrow(
      BadRequestException,
    );
    expect(() => service.validateTarget('//evil.example/health')).toThrow(BadRequestException);
    expect(() => service.validateTarget('/auth/login')).toThrow(BadRequestException);
  });

  it('does not allow duplicate built-in codes', async () => {
    const repository = { create: jest.fn() } as never;
    const service = new MonitoredServicesService(repository);
    await expect(
      service.create(
        { code: 'login', name: 'Otro', endpoint: '/auth/health', criticality: 'HIGH' },
        'actor',
      ),
    ).rejects.toThrow(ConflictException);
  });
});
