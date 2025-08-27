import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TelegrafModule } from 'nestjs-telegraf';

import { BotModule } from '~/bot/bot.module';
import { AppEnvironment } from '~/config';
import { ConfigModule } from '~/config/config.module';
import { IConfig } from '~/config/types';
import { ENTITIES } from '~/database';
import { HealthController } from '~/health/health.controller';
import { MonitorModule } from '~/monitor/monitor.module';
import { QueueModule } from '~/queue/queue.module';
import { SchedulerModule } from '~/scheduler/scheduler.module';

@Module({
  imports: [
    LoggerModule.forRoot({ pinoHttp: { autoLogging: false } }),
    TelegrafModule.forRootAsync({
      useFactory: (configService: ConfigService<IConfig, true>) => ({
        token: configService.get('telegram.botToken', { infer: true })
      }),
      imports: [ConfigModule],
      inject: [ConfigService]
    }),
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
        const appConfig = configService.get('app', { infer: true });
        return {
          ...config,
          entities: ENTITIES,
          maxQueryExecutionTime: 500,
          synchronize: false,
          migrationsRun: false,
          installExtensions: true,
          logging: appConfig.env === AppEnvironment.PRODUCTION ? false : true,
          logger: 'formatted-console'
        };
      }
    }),
    ConfigModule,
    CacheModule.register({ isGlobal: true }),
    BotModule,
    MonitorModule,
    QueueModule,
    SchedulerModule
  ],
  controllers: [HealthController],
  providers: []
})
export class MainModule {}
