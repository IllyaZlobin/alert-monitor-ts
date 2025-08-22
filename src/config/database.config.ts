import { registerAs } from '@nestjs/config';
import Joi from 'joi';

export interface DatabaseConfig {
  host: string;
  port: number;
  type: 'postgres';
  username: string;
  password: string;
  database: string;
}

export const databaseConfigSchema = {
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().required(),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required()
};

export const database = registerAs(
  'database',
  (): Record<string, any> => ({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    type: 'postgres'
  })
);
