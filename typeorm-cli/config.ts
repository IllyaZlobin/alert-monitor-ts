import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { ConfigModule } from '~/config/config.module';
import { IConfig } from '~/config/types';

@Module({
  imports: [ConfigModule]
})
class AppModule {}

async function getConfig() {
  const logger = new Logger('TypeormCLI');
  const app = await NestFactory.createApplicationContext(AppModule);
  await app.init();
  const configService = app.get(ConfigService<IConfig, true>);
  const databaseConfig = configService.get('database', { infer: true });
  await app.close();
  const host = databaseConfig.host;
  logger.log(
    `Database configuration: ${JSON.stringify(
      {
        ...databaseConfig,
        host,
        password: '********'
      },
      null,
      2
    )}`
  );
  return new DataSource({
    ...databaseConfig,
    type: 'postgres',
    host,
    applicationName: 'alert-bot',
    installExtensions: true,
    entities: ['src/database/entities/*.ts'],
    migrations: ['migrations/*.ts'],
    migrationsTableName: 'typeorm_migrations'
  });
}

module.exports.dataSource = getConfig();
