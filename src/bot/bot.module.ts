import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegrafModule } from 'nestjs-telegraf';

import { UpdateProvider } from '~/bot/update.provider';
import { ConfigModule } from '~/config/config.module';
import { IConfig } from '~/config/types';
import { UserEntity } from '~/database/entities';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      useFactory: (configService: ConfigService<IConfig, true>) => ({
        token: configService.get('telegram.botToken', { infer: true })
      }),
      imports: [ConfigModule],
      inject: [ConfigService]
    }),
    TypeOrmModule.forFeature([UserEntity])
  ],
  providers: [UpdateProvider]
})
export class BotModule {}
