import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

function splitOrigins(raw: string | undefined): string[] | true {
  const value = (raw || '*').trim();
  if (value === '*') return true;
  return value.split(',').map((o) => o.trim()).filter(Boolean);
}

function publicApiUrl(configService: ConfigService): string | undefined {
  const explicit = configService.get<string>('PUBLIC_API_URL');
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`;
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
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [
            `'self'`,
            'data:',
            'blob:',
            'validator.swagger.io',
            'http://localhost:4200',
            'https://res.cloudinary.com',
          ],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  const corsOrigin = splitOrigins(configService.get<string>('CORS_ORIGIN'));
  app.enableCors({
    origin: corsOrigin,
    credentials: corsOrigin !== true,
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
      .setVersion('1.0')
      .addServer('http://localhost:3000', 'Local');

    const prodUrl = publicApiUrl(configService);
    if (prodUrl) {
      swaggerConfig.addServer(prodUrl, 'Production');
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

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        displayRequestDuration: true,
      },
      customSiteTitle: 'Offer Lanka API Docs',
      customCss: '.swagger-ui .topbar { display: none }',
      jsonDocumentUrl: 'api/docs-json',
    });
  }
}
