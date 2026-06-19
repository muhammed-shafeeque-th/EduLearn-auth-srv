import IHashService from '@/application/adaptors/hash.service';

export function createMockHashService(): jest.Mocked<IHashService> {
  return {
    hash: jest.fn(),
    compare: jest.fn(),
  } as unknown as jest.Mocked<IHashService>;
}
