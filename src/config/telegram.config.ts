import { registerAs } from '@nestjs/config';
import Joi from 'joi';

export interface TelegramConfig {
  publicAlertGroupUrl: string;
  botToken: string;
}

export const telegramConfigSchema = {
  BOT_TOKEN: Joi.string().required(),
  PUBLIC_ALERT_GROUP_URL: Joi.string().required()
};

export const telegram = registerAs(
  'telegram',
  (): Record<string, any> => ({
    botToken: process.env.BOT_TOKEN,
    publicAlertGroupUrl: process.env.PUBLIC_ALERT_GROUP_URL
  })
);
