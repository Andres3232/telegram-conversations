import { Email } from '@src/domain/value-objects/email.vo';
import { User } from '@src/domain/model/user.entity';

export const USER_REPOSITORY = 'UserRepository';

export interface UserRepository {
  findByEmail(email: Email): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  save(user: User): Promise<User>;
}
