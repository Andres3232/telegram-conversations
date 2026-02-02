
import type { Repository } from 'typeorm';

import { TypeOrmUserRepository } from '@src/infrastructure/adapters/repositories/user/typeorm-user.repository';
import { UserPersistence } from '@src/infrastructure/adapters/repositories/user/user.persistence';
import { User } from '@src/domain/model/user.entity';
import { Email } from '@src/domain/value-objects/email.vo';

describe('TypeOrmUserRepository', () => {
	it('findByEmail: delegates to TypeORM using normalized email and maps persistence -> domain', async () => {
		// Arrange
		const row = new UserPersistence();
		row.id = '11111111-1111-1111-1111-111111111111';
		row.email = 'foo@bar.com';
		row.passwordHash = 'hash';
		row.createdAt = new Date('2026-01-01T00:00:00.000Z');
		row.updatedAt = new Date('2026-01-01T00:00:01.000Z');

		const ormRepo = {
			findOne: jest.fn().mockResolvedValue(row),
		} as unknown as Pick<Repository<UserPersistence>, 'findOne'>;

		const repo = new TypeOrmUserRepository(ormRepo as any);

		// Act
		const result = await repo.findByEmail(Email.create('  FOO@BAR.com  '));

		// Assert
		expect(ormRepo.findOne).toHaveBeenCalledWith({
			where: { email: 'foo@bar.com' },
		});
		expect(result).toBeDefined();
		expect(result?.id).toBe('11111111-1111-1111-1111-111111111111');
		expect(result?.email.toString()).toBe('foo@bar.com');
		expect(result?.passwordHash).toBe('hash');
	});

	it('findById: delegates to TypeORM and maps persistence -> domain', async () => {
		// Arrange
		const row = new UserPersistence();
		row.id = '22222222-2222-2222-2222-222222222222';
		row.email = 'a@b.com';
		row.passwordHash = 'hash2';
		row.createdAt = new Date('2026-01-01T00:00:00.000Z');
		row.updatedAt = new Date('2026-01-01T00:00:01.000Z');

		const ormRepo = {
			findOne: jest.fn().mockResolvedValue(row),
		} as unknown as Pick<Repository<UserPersistence>, 'findOne'>;

		const repo = new TypeOrmUserRepository(ormRepo as any);

		// Act
		const result = await repo.findById('22222222-2222-2222-2222-222222222222');

		// Assert
		expect(ormRepo.findOne).toHaveBeenCalledWith({
			where: { id: '22222222-2222-2222-2222-222222222222' },
		});
		expect(result?.id).toBe('22222222-2222-2222-2222-222222222222');
		expect(result?.email.toString()).toBe('a@b.com');
	});

	it('save: maps domain -> persistence and back to domain', async () => {
		// Arrange
		const domain = User.rehydrate({
			id: '33333333-3333-3333-3333-333333333333',
			email: Email.create('save@test.com'),
			passwordHash: 'hash3',
			createdAt: new Date('2026-01-01T00:00:00.000Z'),
			updatedAt: new Date('2026-01-01T00:00:01.000Z'),
		});

		const savedRow = new UserPersistence();
		savedRow.id = domain.id;
		savedRow.email = domain.email.toString();
		savedRow.passwordHash = domain.passwordHash;
		savedRow.createdAt = domain.createdAt;
		savedRow.updatedAt = domain.updatedAt;

		const ormRepo = {
			save: jest.fn().mockResolvedValue(savedRow),
		} as unknown as Pick<Repository<UserPersistence>, 'save'>;

		const repo = new TypeOrmUserRepository(ormRepo as any);

		// Act
		const result = await repo.save(domain);

		// Assert
		expect(ormRepo.save).toHaveBeenCalledTimes(1);
		const savedArg = (ormRepo.save as jest.Mock).mock.calls[0][0] as UserPersistence;
		expect(savedArg).toBeInstanceOf(UserPersistence);
		expect(savedArg.id).toBe('33333333-3333-3333-3333-333333333333');
		expect(savedArg.email).toBe('save@test.com');
		expect(savedArg.passwordHash).toBe('hash3');

		expect(result.id).toBe('33333333-3333-3333-3333-333333333333');
		expect(result.email.toString()).toBe('save@test.com');
		expect(result.passwordHash).toBe('hash3');
	});
});
