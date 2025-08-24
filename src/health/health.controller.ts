/* eslint-disable @typescript-eslint/require-await */
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IConfig } from '~/config/types';

@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService<IConfig, true>) {}

  @Get('health')
  async health() {
    const appConfig = this.configService.get('app', { infer: true });

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: appConfig.env,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
  }
}
