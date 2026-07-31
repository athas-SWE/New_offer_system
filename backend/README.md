# Offer Lanka Backend

NestJS + TypeORM + MySQL API for the Offer Lanka SaaS platform.

## Quick start

1. Copy env: `cp .env.example .env`
2. Create DB and apply schema: `mysql -u root -p < sql/schema.sql`
3. Install: `npm install`
4. Run: `npm run start:dev`
5. Swagger: http://localhost:3000/api/docs

Default seeded admin (on boot):
- Email: `admin@offerlanka.lk`
- Password: `Admin@12345`

## Scripts

- `npm run start:dev` — watch mode
- `npm run build` / `npm run start:prod`
- `npm test` — unit tests
- Docker: `docker build -t offer-lanka-api .`
