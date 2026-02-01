import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JWT_SERVICE, JwtServicePort } from '@src/domain/ports/jwt.service';
import { Inject } from '@nestjs/common';

export type AuthenticatedRequest = Request & {
  user?: { id: string; email: string };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(JWT_SERVICE) private readonly jwt: JwtServicePort) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const auth = (req.headers as any)?.authorization as string | undefined;

    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = auth.slice('Bearer '.length).trim();
    try {
      const payload = await this.jwt.verify(token);
      req.user = { id: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
