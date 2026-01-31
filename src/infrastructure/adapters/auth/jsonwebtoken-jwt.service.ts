import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { JwtPayload, JwtServicePort } from '@src/domain/ports/jwt.service';

@Injectable()
export class JsonWebTokenService implements JwtServicePort {
  private readonly secret: string;

  constructor() {
    this.secret = process.env.JWT_SECRET ?? '';
    if (!this.secret) {
      throw new Error('Missing JWT_SECRET');
    }
  }

  async sign(payload: JwtPayload): Promise<string> {
    return jwt.sign(payload, this.secret, { expiresIn: '1h' });
  }

  async verify(token: string): Promise<JwtPayload> {
    const decoded = jwt.verify(token, this.secret);
    return decoded as JwtPayload;
  }
}
