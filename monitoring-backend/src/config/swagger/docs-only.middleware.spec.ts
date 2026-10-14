import { docsOnlyMiddleware } from '@/config/swagger/docs-only.middleware';

describe('docsOnlyMiddleware', () => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const next = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it.each(['/api/docs', '/api/docs/swagger-ui.css', '/api/docs-json'])(
    'allows documentation path %s',
    (path) => {
      docsOnlyMiddleware({ path }, response, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(response.status).not.toHaveBeenCalled();
    },
  );

  it('blocks operational routes, including login and health', () => {
    for (const path of ['/auth/login', '/health', '/monitoring/run']) {
      docsOnlyMiddleware({ path }, response, next);
    }
    expect(response.status).toHaveBeenCalledTimes(3);
    expect(response.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });
});
