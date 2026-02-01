import { LoginUseCase } from '@src/application/use-cases/auth/login.use-case';
import { InvalidCredentialsError } from '@src/domain/errors/auth.errors';
import { Email } from '@src/domain/value-objects/email.vo';
import { User } from '@src/domain/model/user.entity';

describe('LoginUseCase', () => {
  const USER_ID = '11111111-1111-1111-1111-111111111111';

  const makeLogger = () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    logHttpDebugRequest: jest.fn(),
    logHttpDebugResponse: jest.fn(),
  });

  it('returns accessToken for valid credentials', async () => {
    // Arrange
    const user = User.rehydrate({
      id: USER_ID,
      email: Email.create('test@example.com'),
      passwordHash: 'hashed',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const userRepo = {
      findByEmail: jest.fn().mockResolvedValue(user),
      save: jest.fn(),
    };
    const hasher = {
      verify: jest.fn().mockResolvedValue(true),
      hash: jest.fn(),
    };
    const jwt = {
      sign: jest.fn().mockResolvedValue('jwt-token'),
      verify: jest.fn(),
    };
    const logger = makeLogger();

    const useCase = new LoginUseCase(
      userRepo as any,
      hasher as any,
      jwt as any,
      logger as any,
    );

    // Act
    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'plain',
    });

    // Assert
    expect(result).toEqual({ accessToken: 'jwt-token' });
    expect(userRepo.findByEmail).toHaveBeenCalledWith(
      Email.create('test@example.com'),
    );
    expect(hasher.verify).toHaveBeenCalledWith('plain', 'hashed');
    expect(jwt.sign).toHaveBeenCalledWith({
      sub: USER_ID,
      email: 'test@example.com',
    });
    expect(logger.info).toHaveBeenCalledWith('Login requested', {
      email: 'test@example.com',
    });
    expect(logger.info).toHaveBeenCalledWith('Login succeeded', {
      userId: USER_ID,
      email: 'test@example.com',
    });
  });

  it('throws InvalidCredentialsError when user is not found', async () => {
    // Arrange
    const userRepo = {
      findByEmail: jest.fn().mockResolvedValue(undefined),
      save: jest.fn(),
    };
    const hasher = {
      verify: jest.fn(),
      hash: jest.fn(),
    };
    const jwt = {
      sign: jest.fn(),
      verify: jest.fn(),
    };
    const logger = makeLogger();

    const useCase = new LoginUseCase(
      userRepo as any,
      hasher as any,
      jwt as any,
      logger as any,
    );

    // Act + Assert
    await expect(
      useCase.execute({ email: 'test@example.com', password: 'x' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(hasher.verify).not.toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Login failed: invalid credentials',
      { email: 'test@example.com' },
    );
  });

  it('throws InvalidCredentialsError when password is invalid', async () => {
    // Arrange
    const user = User.rehydrate({
      id: USER_ID,
      email: Email.create('test@example.com'),
      passwordHash: 'hashed',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const userRepo = {
      findByEmail: jest.fn().mockResolvedValue(user),
      save: jest.fn(),
    };
    const hasher = {
      verify: jest.fn().mockResolvedValue(false),
      hash: jest.fn(),
    };
    const jwt = {
      sign: jest.fn(),
      verify: jest.fn(),
    };
    const logger = makeLogger();

    const useCase = new LoginUseCase(
      userRepo as any,
      hasher as any,
      jwt as any,
      logger as any,
    );

    // Act + Assert
    await expect(
      useCase.execute({ email: 'test@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(hasher.verify).toHaveBeenCalledWith('wrong', 'hashed');
    expect(jwt.sign).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Login failed: invalid credentials',
      { email: 'test@example.com' },
    );
  });
});
