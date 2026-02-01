import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationService } from '@src/domain/ports/configuration.service';
@Injectable()
export class NestConfigurationService implements ConfigurationService {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  get(key: string): string {
    return this.configService.get<string>(key);
  }

  getNumber(key: string): number {
    const value = this.get(key);
    const parsedValue = Number(value);
    if (isNaN(parsedValue)) {
      throw new Error(
        `Configuration value for key "${key}" is not a valid number`,
      );
    }
    return parsedValue;
  }
}
