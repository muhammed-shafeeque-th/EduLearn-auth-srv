import IAuthUserRepository from '@/domain/repository/user.repository';

export function createMockUserRepository(): jest.Mocked<IAuthUserRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<IAuthUserRepository>;
}
