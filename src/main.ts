import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { IConfig } from '~/config/types';
import { MainModule } from '~/main.module';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(MainModule);

  const configService = app.get(ConfigService<IConfig, true>);

  const appConfig = configService.get('app', { infer: true });

  app.enableCors();
  app.enableShutdownHooks();

  await app.listen(appConfig.port);

  logger.log(`==========================================================`);
  logger.log(`🚀 Application is running on port ${appConfig.port}. Environment: ${appConfig.env}`);
  logger.log(`==========================================================`);
}
bootstrap();
