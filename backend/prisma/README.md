# Prisma (Offer Lanka)

Schema: `schema.prisma`  
Migrations: `migrations/`

## Commands (from `backend/`)

```bash
npx prisma migrate dev --name <migration_name>
npx prisma generate
npx prisma studio
npx prisma db push
```

Requires `DATABASE_URL` in `.env`:

```env
DATABASE_URL="mysql://root:root@127.0.0.1:3306/offer_lanka"
```

NestJS still uses TypeORM for runtime queries; Prisma owns schema migrations.
