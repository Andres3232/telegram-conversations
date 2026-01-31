import { Body, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RegisterUserUseCase } from '@src/application/use-cases/auth/register-user.use-case';
import { LoginUseCase } from '@src/application/use-cases/auth/login.use-case';
import { GetMeUseCase } from '@src/application/use-cases/auth/get-me.use-case';

import { RestController } from '@src/infrastructure/rest/shared/rest.decorator';
import { LoginRequestDto, LoginResponseDto, RegisterRequestDto } from './dto/auth.dto';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';
import { Req } from '@nestjs/common';

@RestController('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly login: LoginUseCase,
    private readonly me: GetMeUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a user' })
  @ApiOkResponse({
    schema: {
      example: { id: 'uuid', email: 'admin@example.com' },
    },
  })
  async register(@Body() body: RegisterRequestDto) {
  return this.registerUser.execute(RegisterRequestDto.toDomainInput(body));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get JWT' })
  @ApiOkResponse({ type: LoginResponseDto })
  async loginEndpoint(@Body() body: LoginRequestDto): Promise<LoginResponseDto> {
  return this.login.execute(LoginRequestDto.toDomainInput(body));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiOkResponse({ schema: { example: { id: 'uuid', email: 'admin@example.com' } } })
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.me.execute({ userId: req.user!.id });
  }
}
