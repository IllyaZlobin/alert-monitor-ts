import { ConfigType } from '@nestjs/config';

import { AppConfig } from '~/config/app.config';
import { DatabaseConfig } from '~/config/database.config';
import { RedisConfig } from '~/config/redis.config';
import { TelegramConfig } from '~/config/telegram.config';

export interface IConfig {
  app: ConfigType<(...args: any) => AppConfig>;
  database: ConfigType<(...args: any) => DatabaseConfig>;
  telegram: ConfigType<(...args: any) => TelegramConfig>;
  redis: ConfigType<(...args: any) => RedisConfig>;
}
