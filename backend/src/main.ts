import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  await configureApp(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  const swaggerEnabled =
    configService.get<string>('SWAGGER_ENABLED', 'true') !== 'false';
  // eslint-disable-next-line no-console
  console.log(`Offer Lanka API running on http://localhost:${port}/api`);
  if (swaggerEnabled) {
    // eslint-disable-next-line no-console
    console.log(`Swagger UI → http://localhost:${port}/api/docs`);
    // eslint-disable-next-line no-console
    console.log(`OpenAPI JSON → http://localhost:${port}/api/docs-json`);
  }
}

void bootstrap();
