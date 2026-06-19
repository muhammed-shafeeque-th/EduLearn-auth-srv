import ChangePasswordUseCaseImpl from '@/application/use-cases/user/impls/change-password.use-case';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import BadRequestError from '@/shared/errors/bad-request.error';
import { buildChangePasswordDto } from 'test/fixtures/dto.fixture';
import { buildUser } from 'test/fixtures/user.fixture';
import {
  createMockHashService,
  createMockUserRepository,
  createObservabilityMocks,
} from 'test/helpers/test-doubles';

describe('ChangePasswordUseCaseImpl', () => {
  let useCase: ChangePasswordUseCaseImpl;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let hashService: ReturnType<typeof createMockHashService>;
  let user: ReturnType<typeof buildUser>;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    hashService = createMockHashService();
    const { logger, tracer } = createObservabilityMocks();
    user = buildUser({ id: 'user-123', password: 'hashed-old' });
    useCase = new ChangePasswordUseCaseImpl(userRepository, hashService, logger, tracer);
  });

  it('changes the password when credentials are valid', async () => {
    const dto = buildChangePasswordDto();
    userRepository.findById.mockResolvedValue(user);
    hashService.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    hashService.hash.mockResolvedValue('hashed-new');

    const result = await useCase.execute(dto);

    expect(hashService.hash).toHaveBeenCalledWith(dto.newPassword);
    expect(user.getPassword()).toBe('hashed-new');
    expect(userRepository.update).toHaveBeenCalledWith(dto.userId, user);
    expect(result).toEqual({ userId: 'user-123' });
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute(buildChangePasswordDto())).rejects.toThrow(UserNotFoundError);
  });

  it('throws BadRequestError when the old password does not match', async () => {
    userRepository.findById.mockResolvedValue(user);
    hashService.compare.mockResolvedValueOnce(false);
    await expect(useCase.execute(buildChangePasswordDto())).rejects.toThrow(BadRequestError);
  });

  it('throws BadRequestError when the new password matches the current password', async () => {
    userRepository.findById.mockResolvedValue(user);
    hashService.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    await expect(useCase.execute(buildChangePasswordDto())).rejects.toThrow(BadRequestError);
  });
});
