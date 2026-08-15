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
import { HealthModule } from './health/health.module';
import { typeOrmMysqlOptions } from './config/mysql.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
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
      useFactory: (config: ConfigService) => typeOrmMysqlOptions(config),
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
    HealthModule,
    SeedModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
