import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';

import { BotModule } from '~/bot/bot.module';
import { ConfigModule } from '~/config/config.module';
import { IConfig } from '~/config/types';
import { ENTITIES } from '~/database';
import { MonitorModule } from '~/monitor/monitor.module';
import { QueueModule } from '~/queue/queue.module';

@Module({
  imports: [
    LoggerModule.forRoot({ pinoHttp: { autoLogging: false } }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<IConfig, true>) => {
        return { connection: { url: configService.get('redis.url', { infer: true }) } };
      }
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<IConfig, true>) => {
        const config = configService.get('database', { infer: true });
        return {
          ...config,
          entities: ENTITIES,
          maxQueryExecutionTime: 500,
          synchronize: false,
          migrationsRun: false,
          installExtensions: true,
          logging: true,
          logger: 'formatted-console'
        };
      }
    }),
    ConfigModule,
    BotModule,
    MonitorModule,
    QueueModule
  ],
  controllers: [],
  providers: []
})
export class MainModule {}
