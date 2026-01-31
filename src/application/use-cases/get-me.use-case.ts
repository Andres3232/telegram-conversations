import { Inject, Injectable } from '@nestjs/common';

import { USER_REPOSITORY, UserRepository } from '@src/domain/ports/user.repository';

export interface GetMeInput {
  userId: string;
}

export interface GetMeOutput {
  id: string;
  email: string;
}

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  async execute(input: GetMeInput): Promise<GetMeOutput> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email.toString(),
    };
  }
}
