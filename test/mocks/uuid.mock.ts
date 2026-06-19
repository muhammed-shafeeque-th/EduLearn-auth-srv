import IUUIDService from '@/application/adaptors/uuid.service';

export function createMockUuidService(defaultValue = 'generated-uuid'): jest.Mocked<IUUIDService> {
  return {
    generate: jest.fn().mockReturnValue(defaultValue),
  } as unknown as jest.Mocked<IUUIDService>;
}
