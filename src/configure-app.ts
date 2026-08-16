import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { Request, Response } from 'express';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { swaggerUiHtml } from './swagger-ui.html';

function splitOrigins(raw: string | undefined): string[] | true {
  const value = (raw || '*').trim();
  if (value === '*') return true;
  return value.split(',').map((o) => o.trim()).filter(Boolean);
}

function withHttps(url: string): string {
  const trimmed = url.replace(/\/$/, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function publicApiUrl(configService: ConfigService): string | undefined {
  const explicit = configService.get<string>('PUBLIC_API_URL');
  if (explicit) return withHttps(explicit);
  const vercel = process.env.VERCEL_URL;
  if (vercel) return withHttps(vercel);
  return undefined;
}

export async function configureApp(app: NestExpressApplication): Promise<void> {
  const configService = app.get(ConfigService);

  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`, 'https://unpkg.com'],
          imgSrc: [
            `'self'`,
            'data:',
            'blob:',
            'validator.swagger.io',
            'http://localhost:4200',
            'https://res.cloudinary.com',
            'https://unpkg.com',
          ],
          fontSrc: [`'self'`, 'data:', 'https://unpkg.com'],
          connectSrc: [`'self'`],
          scriptSrc: [
            `'self'`,
            `'unsafe-inline'`,
            `'unsafe-eval'`,
            'https://unpkg.com',
          ],
          scriptSrcAttr: [`'unsafe-inline'`],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  const configuredOrigins = splitOrigins(configService.get<string>('CORS_ORIGIN'));
  const apiPublicUrl = publicApiUrl(configService);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (configuredOrigins === true) {
        callback(null, true);
        return;
      }
      const allowed = [...configuredOrigins];
      if (apiPublicUrl) allowed.push(apiPublicUrl);
      if (allowed.includes(origin)) {
        callback(null, true);
        return;
      }
      if (process.env.VERCEL && origin.endsWith('.vercel.app')) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
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

  const swaggerEnabled =
    configService.get<string>('SWAGGER_ENABLED', 'true') !== 'false';

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Offer Lanka API')
      .setDescription(
        [
          'Sri Lanka daily offers platform REST API.',
          '',
          '### Auth',
          '1. Call `POST /api/auth/login`',
          '2. Copy `accessToken` from the response',
          '3. Click **Authorize** and paste: `Bearer <accessToken>` or just the token',
          '',
          '### Roles (login)',
          '`ADMIN` · `BUSINESS_OWNER` — shoppers browse publicly without login',
          '',
          'Seeded: `admin@offerlanka.lk` / `Admin@12345` · `business@offerlanka.lk` / `Business@12345`',
        ].join('\n'),
      )
      .setVersion('1.0');

    const prodUrl = publicApiUrl(configService);
    if (prodUrl) {
      swaggerConfig.addServer(prodUrl, 'Vercel');
    }
    if (!process.env.VERCEL) {
      swaggerConfig.addServer('http://localhost:3000', 'Local');
    }

    swaggerConfig
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Paste the JWT access token from /api/auth/login',
          in: 'header',
        },
        'access-token',
      )
      .addTag('Auth', 'Register, login, refresh, logout')
      .addTag('Users', 'User management')
      .addTag('Shops', 'Shop CRUD, registration and approval')
      .addTag('Offers', 'Offer CRUD, images, search')
      .addTag('Categories', 'Offer categories')
      .addTag('Locations', 'Cities and districts')
      .addTag('Favorites', 'Customer saved offers')
      .addTag('Reviews', 'Offer reviews')
      .addTag('Notifications', 'In-app notifications')
      .addTag('Analytics', 'Event tracking')
      .addTag('Dashboard', 'Admin and shop metrics')
      .addTag('Reports', 'PDF / Excel exports')
      .addTag('Hero Slides', 'Home page hero slideshow')
      .addTag('Health', 'Liveness and database check');

    const document = SwaggerModule.createDocument(app, swaggerConfig.build(), {
      deepScanRoutes: true,
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        `${controllerKey}_${methodKey}`,
    });

    // CDN Swagger UI — Nest's default UI serves swagger-ui-dist from disk,
    // which is missing/blank on Vercel serverless. JSON + HTML are public Express routes.
    const http = app.getHttpAdapter();
    const sendJson = (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json(document);
    };
    const sendHtml = (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(swaggerUiHtml());
    };
    http.get('/api/docs-json', sendJson);
    http.get('/api/docs', sendHtml);
    http.get('/api/docs/', sendHtml);
  }
}
