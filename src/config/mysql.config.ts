import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../modules/users/entities/role.entity';
import { Shop } from '../modules/shops/entities/shop.entity';
import { Offer } from '../modules/offers/entities/offer.entity';
import { OfferImage } from '../modules/offers/entities/offer-image.entity';
import { ServiceListing } from '../modules/services/entities/service-listing.entity';
import { Rental } from '../modules/rentals/entities/rental.entity';
import { PosProduct } from '../modules/pos/entities/pos-product.entity';
import { PosSale } from '../modules/pos/entities/pos-sale.entity';
import { PosSaleItem } from '../modules/pos/entities/pos-sale-item.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { Favorite } from '../modules/favorites/entities/favorite.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { Review } from '../modules/reviews/entities/review.entity';
import { City } from '../modules/locations/entities/city.entity';
import { District } from '../modules/locations/entities/district.entity';
import { Analytics } from '../modules/analytics/entities/analytics.entity';
import { AuditLog } from '../modules/analytics/entities/audit-log.entity';
import { HeroSlide } from '../modules/hero-slides/entities/hero-slide.entity';

type MysqlSsl =
  | {
      rejectUnauthorized: boolean;
      ca?: string;
    }
  | undefined;

const ENTITIES = [
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

function isAivenHost(host?: string): boolean {
  if (!host) return false;
  return host.includes('aivencloud.com') || host.includes('.aiven.');
}

function parseDatabaseUrl(databaseUrl: string): {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
} | null {
  try {
    const parsed = new URL(databaseUrl);
    const database = decodeURIComponent(
      parsed.pathname.replace(/^\//, '').split('/')[0] || '',
    );
    if (!parsed.hostname || !database) return null;
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      username: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database,
    };
  } catch {
    return null;
  }
}

function resolveMysqlSsl(
  config: ConfigService,
  databaseUrl: string | undefined,
  host: string | undefined,
): MysqlSsl {
  const explicit = (config.get<string>('DB_SSL') || '').toLowerCase();
  if (explicit === 'false' || explicit === 'disable' || explicit === 'disabled') {
    return undefined;
  }

  let sslRequired =
    explicit === 'true' ||
    explicit === 'strict' ||
    explicit === 'required' ||
    config.get('NODE_ENV') === 'production' ||
    isAivenHost(host) ||
    Boolean(process.env.VERCEL);

  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);
      const sslMode = (
        parsed.searchParams.get('ssl-mode') ||
        parsed.searchParams.get('sslmode') ||
        parsed.searchParams.get('sslaccept') ||
        ''
      ).toUpperCase();
      if (['REQUIRED', 'VERIFY_CA', 'VERIFY_IDENTITY', 'STRICT'].includes(sslMode)) {
        sslRequired = true;
      }
      if (['DISABLED', 'DISABLE', 'FALSE'].includes(sslMode)) {
        sslRequired = false;
      }
      if (isAivenHost(parsed.hostname)) {
        sslRequired = true;
      }
    } catch {
      // ignore malformed URL here; connection parse happens separately
    }
  }

  if (!sslRequired) return undefined;

  const caRaw =
    config.get<string>('AIVEN_CA_CERT') || config.get<string>('MYSQL_CA_CERT');
  const ca = caRaw ? caRaw.replace(/\\n/g, '\n') : undefined;
  const rejectUnauthorized =
    explicit === 'strict' || Boolean(ca);

  return {
    rejectUnauthorized,
    ...(ca ? { ca } : {}),
  };
}

export function typeOrmMysqlOptions(config: ConfigService): TypeOrmModuleOptions {
  const databaseUrl = config.get<string>('DATABASE_URL')?.trim();
  const parsed = databaseUrl ? parseDatabaseUrl(databaseUrl) : null;
  const isServerless = Boolean(process.env.VERCEL);

  const host =
    parsed?.host || config.get<string>('DB_HOST', 'localhost') || 'localhost';
  const port = parsed?.port || Number(config.get('DB_PORT', 3306));
  const username =
    parsed?.username || config.get<string>('DB_USERNAME', 'root') || 'root';
  const password =
    parsed?.password ?? config.get<string>('DB_PASSWORD', 'root') ?? 'root';
  const database =
    parsed?.database ||
    config.get<string>('DB_DATABASE', 'offer_lanka') ||
    'offer_lanka';

  const poolSize = Number(
    config.get('DB_POOL_SIZE', isServerless ? 2 : 10),
  );
  const ssl = resolveMysqlSsl(config, databaseUrl, host);

  const extra: Record<string, unknown> = {
    connectionLimit: poolSize,
    connectTimeout: Number(config.get('DB_CONNECT_TIMEOUT', 20000)),
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  };
  if (ssl) {
    extra.ssl = ssl;
  }

  return {
    type: 'mysql',
    host,
    port,
    username,
    password,
    database,
    entities: ENTITIES,
    synchronize: false,
    logging: config.get('NODE_ENV') === 'development',
    timezone: 'Z',
    charset: 'utf8mb4',
    retryAttempts: Number(config.get('DB_RETRY_ATTEMPTS', 3)),
    retryDelay: Number(config.get('DB_RETRY_DELAY', 2000)),
    extra,
    ...(ssl ? { ssl } : {}),
  };
}
