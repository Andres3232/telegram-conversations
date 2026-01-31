import { Inject, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { JwtPayload, JwtServicePort } from '@src/domain/ports/jwt.service';
import {
  CONFIGURATION_SERVICE,
  ConfigurationService,
} from '@src/domain/ports/configuration.service';
import { ConfigKeys } from '@src/config/config-keys';

@Injectable()
export class JsonWebTokenService implements JwtServicePort {
  private readonly secret: string;

  constructor(
    @Inject(CONFIGURATION_SERVICE)
    private readonly config: ConfigurationService,
  ) {
    this.secret = this.config.get(ConfigKeys.JWT_SECRET) ?? '';
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
