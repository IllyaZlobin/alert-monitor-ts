import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { BotModule } from '~/bot/bot.module';
import { ConfigModule } from '~/config/config.module';
import { MonitorModule } from '~/monitor/monitor.module';

@Module({
  imports: [LoggerModule.forRoot({ pinoHttp: { autoLogging: false } }), ConfigModule, BotModule, MonitorModule],
  controllers: [],
  providers: []
})
export class MainModule {}
