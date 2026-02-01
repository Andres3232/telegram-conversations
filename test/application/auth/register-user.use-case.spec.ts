import { RegisterUserUseCase } from '@src/application/use-cases/auth/register-user.use-case';
import { UserAlreadyExistsError } from '@src/domain/errors/auth.errors';
import { Email } from '@src/domain/value-objects/email.vo';
import { User } from '@src/domain/model/user.entity';

describe('RegisterUserUseCase', () => {
  const EXISTING_USER_ID = '22222222-2222-2222-2222-222222222222';

  const makeLogger = () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    logHttpDebugRequest: jest.fn(),
    logHttpDebugResponse: jest.fn(),
  });

  it('registers a new user when email is not taken', async () => {
    // Arrange
    const userRepo = {
      findByEmail: jest.fn().mockResolvedValue(undefined),
      save: jest.fn(async (u: User) => u),
    };
    const hasher = {
      hash: jest.fn().mockResolvedValue('hashed-password'),
      verify: jest.fn(),
    };
    const logger = makeLogger();

    const useCase = new RegisterUserUseCase(
      userRepo as any,
      hasher as any,
      logger as any,
    );

    // Act
    const result = await useCase.execute({
      email: 'new@example.com',
      password: '12345678',
    });

    // Assert
    expect(userRepo.findByEmail).toHaveBeenCalledWith(
      Email.create('new@example.com'),
    );
    expect(hasher.hash).toHaveBeenCalledWith('12345678');
    expect(userRepo.save).toHaveBeenCalledTimes(1);

    // saved user is generated internally: assert through return value
    expect(result.email).toBe('new@example.com');
    expect(result.id).toEqual(expect.any(String));

    expect(logger.info).toHaveBeenCalledWith('Register user requested', {
      email: 'new@example.com',
    });
    expect(logger.info).toHaveBeenCalledWith('User registered', {
      userId: result.id,
      email: 'new@example.com',
    });
  });

  it('throws UserAlreadyExistsError when email is already taken', async () => {
    // Arrange
    const existing = User.rehydrate({
      id: EXISTING_USER_ID,
      email: Email.create('taken@example.com'),
      passwordHash: 'hashed',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const userRepo = {
      findByEmail: jest.fn().mockResolvedValue(existing),
      save: jest.fn(),
    };
    const hasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    };
    const logger = makeLogger();

    const useCase = new RegisterUserUseCase(
      userRepo as any,
      hasher as any,
      logger as any,
    );

    // Act + Assert
    await expect(
      useCase.execute({ email: 'taken@example.com', password: '12345678' }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);

    expect(hasher.hash).not.toHaveBeenCalled();
    expect(userRepo.save).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Register user failed: already exists',
      { email: 'taken@example.com' },
    );
  });
});
