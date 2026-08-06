import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ShopsModule } from './modules/shops/shops.module';
import { OffersModule } from './modules/offers/offers.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { LocationsModule } from './modules/locations/locations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HeroSlidesModule } from './modules/hero-slides/hero-slides.module';
import { ServicesModule } from './modules/services/services.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { PosModule } from './modules/pos/pos.module';
import { SeedModule } from './seed/seed.module';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { FacebookModule } from './modules/facebook/facebook.module';

import { User } from './modules/users/entities/user.entity';
import { Role } from './modules/users/entities/role.entity';
import { Shop } from './modules/shops/entities/shop.entity';
import { Offer } from './modules/offers/entities/offer.entity';
import { OfferImage } from './modules/offers/entities/offer-image.entity';
import { ServiceListing } from './modules/services/entities/service-listing.entity';
import { Rental } from './modules/rentals/entities/rental.entity';
import { PosProduct } from './modules/pos/entities/pos-product.entity';
import { PosSale } from './modules/pos/entities/pos-sale.entity';
import { PosSaleItem } from './modules/pos/entities/pos-sale-item.entity';
import { Category } from './modules/categories/entities/category.entity';
import { Favorite } from './modules/favorites/entities/favorite.entity';
import { Notification } from './modules/notifications/entities/notification.entity';
import { Review } from './modules/reviews/entities/review.entity';
import { City } from './modules/locations/entities/city.entity';
import { District } from './modules/locations/entities/district.entity';
import { Analytics } from './modules/analytics/entities/analytics.entity';
import { AuditLog } from './modules/analytics/entities/audit-log.entity';
import { HeroSlide } from './modules/hero-slides/entities/hero-slide.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CloudinaryModule,
    FacebookModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: Number(config.get('THROTTLE_TTL', 60)) * 1000,
          limit: Number(config.get('THROTTLE_LIMIT', 100)),
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const entities = [
          User,
          Role,
          Shop,
          Offer,
          OfferImage,
          ServiceListing,
          Rental,
          PosProduct,
          PosSale,
          PosSaleItem,
          Category,
          Favorite,
          Notification,
          Review,
          City,
          District,
          Analytics,
          AuditLog,
          HeroSlide,
        ];

        const databaseUrl = config.get<string>('DATABASE_URL');
        if (databaseUrl) {
          const parsed = new URL(databaseUrl);
          const sslMode = (
            parsed.searchParams.get('ssl-mode') ||
            parsed.searchParams.get('sslmode') ||
            ''
          ).toUpperCase();
          const sslRequired = ['REQUIRED', 'VERIFY_CA', 'VERIFY_IDENTITY'].includes(sslMode);

          return {
            type: 'mysql' as const,
            host: parsed.hostname,
            port: Number(parsed.port || 3306),
            username: decodeURIComponent(parsed.username),
            password: decodeURIComponent(parsed.password),
            database: parsed.pathname.replace(/^\//, ''),
            ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
            entities,
            synchronize: false,
            logging: config.get('NODE_ENV') === 'development',
            timezone: 'Z',
          };
        }

        return {
          type: 'mysql' as const,
          host: config.get<string>('DB_HOST', 'localhost'),
          port: Number(config.get('DB_PORT', 3306)),
          username: config.get<string>('DB_USERNAME', 'root'),
          password: config.get<string>('DB_PASSWORD', 'root'),
          database: config.get<string>('DB_DATABASE', 'offer_lanka'),
          entities,
          synchronize: false,
          logging: config.get('NODE_ENV') === 'development',
          timezone: 'Z',
        };
      },
    }),
    AuthModule,
    UsersModule,
    ShopsModule,
    OffersModule,
    ServicesModule,
    RentalsModule,
    PosModule,
    CategoriesModule,
    LocationsModule,
    NotificationsModule,
    FavoritesModule,
    ReviewsModule,
    AnalyticsModule,
    DashboardModule,
    ReportsModule,
    HeroSlidesModule,
    SeedModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
