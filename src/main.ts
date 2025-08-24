/* eslint-disable @typescript-eslint/no-floating-promises */
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { IConfig } from '~/config/types';
import { MainModule } from '~/main.module';

async function bootstrap() {
  const app = await NestFactory.create(MainModule);

  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);

  const configService = app.get(ConfigService<IConfig, true>);

  const appConfig = configService.get('app', { infer: true });

  app.setGlobalPrefix('api');
  app.enableCors();
  app.enableShutdownHooks();

  await app.listen(appConfig.port);

  logger.log(`==========================================================`);
  logger.log(`Application is running on port ${appConfig.port}. Environment: ${appConfig.env}`);
  logger.log(`==========================================================`);
}
bootstrap();
