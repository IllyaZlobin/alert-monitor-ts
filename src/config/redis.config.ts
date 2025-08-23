import { registerAs } from '@nestjs/config';
import Joi from 'joi';

export interface RedisConfig {
  url: string;
}

export const redisConfigSchema = {
  REDIS_URL: Joi.string().required()
};

export const redis = registerAs(
  'redis',
  (): Record<string, any> => ({
    url: process.env.REDIS_URL
  })
);
