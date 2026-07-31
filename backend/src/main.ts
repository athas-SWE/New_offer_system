import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const uploadDest = configService.get<string>('UPLOAD_DEST', './uploads');
  if (!existsSync(uploadDest)) {
    mkdirSync(uploadDest, { recursive: true });
  }
  if (!existsSync(join(uploadDest, 'offers'))) {
    mkdirSync(join(uploadDest, 'offers'), { recursive: true });
  }

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: (configService.get<string>('CORS_ORIGIN') || '*')
      .split(',')
      .map((o) => o.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useStaticAssets(join(process.cwd(), uploadDest), { prefix: '/uploads' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Offer Lanka API')
    .setDescription('Production API for Offer Lanka SaaS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Offer Lanka API running on http://localhost:${port}/api`);
  // eslint-disable-next-line no-console
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
