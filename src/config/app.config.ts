import { registerAs } from '@nestjs/config';
import Joi from 'joi';

export enum AppEnvironment {
  LOCAL = 'local',
  PRODUCTION = 'production'
}

export const APP_ENVIRONMENTS: AppEnvironment[] = [AppEnvironment.LOCAL, AppEnvironment.PRODUCTION] as const;

export interface AppConfig {
  port: number;
  env: AppEnvironment;
  globalPrefix: string;
  userLocationsLimit: 5;
}

export const appConfigSchema = {
  APP_PORT: Joi.number().port().required(),
  APP_ENV: Joi.string()
    .valid(...APP_ENVIRONMENTS)
    .required(),
  APP_USER_LOCATION_LIMIT: Joi.number().integer().positive().required()
};

export const app = registerAs('app', () => ({
  port: process.env.APP_PORT,
  env: process.env.APP_ENV,
  userLocationsLimit: process.env.APP_USER_LOCATION_LIMIT,
  globalPrefix: '/api'
}));
