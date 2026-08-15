import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestExpressApplication } from '@nestjs/platform-express';
import express, { Express } from 'express';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

/**
 * Cached Express instance for Vercel serverless (reuse across warm invocations).
 */
export async function createNestExpressHandler(): Promise<Express> {
  const server = express();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server),
    {
      logger:
        process.env.NODE_ENV === 'production'
          ? ['error', 'warn', 'log']
          : ['error', 'warn', 'log', 'debug', 'verbose'],
    },
  );
  await configureApp(app);
  await app.init();
  return server;
}
