import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';

import { ConfigModule } from '~/config/config.module';
import { IConfig } from '~/config/types';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      useFactory: (configService: ConfigService<IConfig, true>) => ({
        token: configService.get('telegram.botToken', { infer: true })
      }),
      imports: [ConfigModule],
      inject: [ConfigService]
    })
  ]
})
export class BotModule {}
