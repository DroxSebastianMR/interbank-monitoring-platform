import { redactAssistantContent } from '@/modules/assistant/services/assistant-content-safety';

describe('redactAssistantContent', () => {
  it('removes secrets and personal identifiers before storage or inference', () => {
    const result = redactAssistantContent(
      'Revisa login de persona@example.com con Bearer abc.def.ghi y api_key=sk-examplesecret123456',
    );

    expect(result).toContain('Revisa login');
    expect(result).not.toContain('persona@example.com');
    expect(result).not.toContain('abc.def.ghi');
    expect(result).not.toContain('sk-examplesecret123456');
  });
});
