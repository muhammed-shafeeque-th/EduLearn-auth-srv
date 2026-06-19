import { ITemplateRenderer } from '@/application/adaptors/template-renderer';

export function createMockTemplateRenderer(
  rendered = '<html>welcome</html>',
): jest.Mocked<ITemplateRenderer> {
  return {
    render: jest.fn().mockResolvedValue(rendered),
    renderFromString: jest.fn().mockResolvedValue(rendered),
    templateExists: jest.fn().mockResolvedValue(true),
  } as unknown as jest.Mocked<ITemplateRenderer>;
}
