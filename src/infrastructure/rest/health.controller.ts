import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly typeOrmHealthIndicator: TypeOrmHealthIndicator,
  ) {}

  @Get('liveness')
  @HealthCheck()
  livenessCheck() {
    return this.healthCheckService.check([]);
  }

  @Get('readiness')
  @HealthCheck()
  readinessCheck() {
    return this.healthCheckService.check([
      async () => this.typeOrmHealthIndicator.pingCheck('postgres'),
    ]);
  }
}
