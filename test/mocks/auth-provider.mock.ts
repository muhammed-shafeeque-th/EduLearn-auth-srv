import IAuthProviderContext from '@/application/adaptors/auth-provider.service';

export function createMockAuthProviderContext(
  executor: { execute: jest.Mock } = { execute: jest.fn() },
): jest.Mocked<IAuthProviderContext> {
  return {
    execute: jest.fn().mockReturnValue(executor),
  } as unknown as jest.Mocked<IAuthProviderContext>;
}
