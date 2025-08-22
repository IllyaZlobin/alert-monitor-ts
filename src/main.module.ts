import { Module } from '@nestjs/common';

import { BotModule } from '~/bot/bot.module';
import { ConfigModule } from '~/config/config.module';

@Module({
  imports: [ConfigModule, BotModule],
  controllers: [],
  providers: []
})
export class MainModule {}
