import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

import { RegisterUserInput } from '@src/application/use-cases/register-user.use-case';
import { LoginInput } from '@src/application/use-cases/login.use-case';

export class RegisterRequestDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;

  static toDomainInput(dto: RegisterRequestDto): RegisterUserInput {
    return {
      email: dto.email,
      password: dto.password,
    };
  }
}

export class LoginRequestDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;

  static toDomainInput(dto: LoginRequestDto): LoginInput {
    return {
      email: dto.email,
      password: dto.password,
    };
  }
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;
}
