# Offer Lanka

Sri Lankan deals and offers platform — customers discover local promotions; business owners publish and manage offers; admins moderate the marketplace.

Monorepo layout:

```
Newoffersystem/
├── backend/          # NestJS REST API (TypeORM + MySQL)
├── frontend/         # Angular 18 SPA (Material + Firebase)
├── database/         # MySQL schema + ER diagram
├── docker-compose.yml
├── .env.example
└── .github/workflows/
```

---

## Project overview

Offer Lanka connects shoppers with time-bound discounts across Sri Lankan cities. Core flows:

- **Customers** browse/search offers by city and category, save favorites, leave reviews, and receive notifications.
- **Business owners** register businesses and stores, create offers with images and discount rules, and track engagement.
- **Admins** approve businesses/offers, manage roles and categories, and inspect audit/analytics data.

---

## Tech stack

| Layer | Technology |
|--------|------------|
| Frontend | Angular 18 (Material + Tailwind + Firebase; upgrade path to Angular 20 ready) |
| Backend | NestJS 11, TypeORM, Passport JWT, Swagger, Helmet, Throttler |
| Database | MySQL 8 (`utf8mb4`) |
| Cache (optional) | Redis 7 |
| Auth | JWT + optional Firebase Auth UID linkage |
| CI/CD | GitHub Actions |
| Deploy | Backend → Vercel; Database → Aiven MySQL 8 |

---

## Prerequisites

- Node.js **20+** and npm
- Docker Desktop (for MySQL / Redis)
- MySQL 8 client (optional, if not using Docker)
- Firebase project (optional, for auth/push)
- Aiven MySQL 8 service (production)
- Vercel account (backend deploy)

---

## Local setup

### 1. Clone and environment

```bash
cd Newoffersystem
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET and DB passwords
```

### 2. Start MySQL (+ Redis)

Default Compose stack starts **MySQL** and **Redis**. Schema is auto-applied from `database/schema.sql` on first MySQL volume init.

```bash
docker compose up -d mysql redis
```

- MySQL: `localhost:3306`
- Database / user: `offer_lanka` / `offerlanka` (see `.env`)
- Redis: `localhost:6379`

If the volume already exists without the schema:

```bash
# PowerShell
Get-Content database\schema.sql | docker compose exec -T mysql mysql -u root -prootpassword offer_lanka
```

```bash
# bash
docker compose exec -T mysql mysql -u root -prootpassword offer_lanka < database/schema.sql
```

### 3. Backend

```bash
cd backend
npm install
cp ../.env.example ../.env   # if not done at root; Nest reads DB_* from env / ConfigModule
npm run start:dev
```

API: [http://localhost:3000](http://localhost:3000)  
Swagger (when enabled): typically `/api` or `/docs` depending on Nest bootstrap.

**Default admin (from seed)**

| Field | Value |
|--------|--------|
| Email | `admin@offerlanka.lk` |
| Password hash | **Placeholder** — replace before login |

Generate a bcrypt hash and update `users.password_hash`:

```bash
node -e "require('bcrypt').hash('ChangeMeAdmin123!', 12).then(console.log)"
```

Or use the Nest seed script when available: `npm run seed`.

### 4. Frontend

```bash
cd frontend
npm install
npm start
```

App: [http://localhost:4200](http://localhost:4200)

Point the Angular API base URL at the backend (environment file or `NG_APP_API_BASE_URL`).

### 5. Full stack via Compose (optional)

When Dockerfiles exist under `backend/` and `frontend/`:

```bash
docker compose --profile full up -d --build
```

Without Dockerfiles, run MySQL/Redis in Docker and Nest/Angular on the host as above.

---

## Environment variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Purpose |
|----------|---------|
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | TypeORM / MySQL connection |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Access token signing |
| `CORS_ORIGIN` | Allowed frontend origin |
| `REDIS_HOST`, `REDIS_PORT` | Optional cache / rate-limit backing |
| `FIREBASE_*` / `GOOGLE_APPLICATION_CREDENTIALS` | Firebase client + Admin SDK |
| `API_BASE_URL` / `NG_APP_API_BASE_URL` | Frontend → API URL |
| `GCP_PROJECT_ID`, `CLOUD_RUN_SERVICE`, … | Deploy placeholders |

Never commit `.env` or service-account JSON files.

---

## Database

- Schema: [`database/schema.sql`](database/schema.sql)
- ER diagram: [`database/er-diagram.md`](database/er-diagram.md)

### Tables

`users`, `roles`, `user_roles`, `businesses`, `stores`, `categories`, `offers`, `offer_images`, `favorites`, `notifications`, `reviews`, `cities`, `districts`, `analytics`, `audit_logs`

Every table includes audit fields: `created_by`, `updated_by`, `created_date`, `updated_date`, `is_deleted`.

### Seeded data

- Roles: `ADMIN`, `BUSINESS_OWNER`, `CUSTOMER`
- Districts/cities: Colombo, Kandy, Galle, Negombo, Jaffna, and more
- Categories: Food, Fashion, Electronics, Travel, Beauty, Services
- Admin user: `admin@offerlanka.lk` (hash placeholder — see note above)

---

## API overview

REST API under NestJS (prefix typically `/api`). Controllers grow with modules; intended surface:

| Area | Examples |
|------|----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Users / roles | Admin CRUD, role assignment |
| Businesses / stores | Owner create/update; admin approve |
| Categories | List public; admin manage |
| Offers | CRUD, publish, filter by city/category/status |
| Offer images | Upload / reorder / set primary |
| Favorites | Add / remove / list for current user |
| Reviews | Create / moderate |
| Notifications | List / mark read |
| Analytics | Ingest events; admin aggregates |
| Geo | Districts & cities lookup |
| Health | `GET /` or `GET /health` |

Interactive docs: enable Swagger via `@nestjs/swagger` in `main.ts`.

Use JWT `Authorization: Bearer <token>` for protected routes. Role guards enforce `ADMIN`, `BUSINESS_OWNER`, and `CUSTOMER`.

---

## Roles and features

| Role | Capabilities |
|------|----------------|
| **ADMIN** | Approve/reject businesses and offers; manage users, roles, categories; view audit logs and analytics; moderate reviews |
| **BUSINESS_OWNER** | Register business & stores; create/edit offers and images; view own analytics; respond to business activity |
| **CUSTOMER** | Browse/search offers; favorite offers; write reviews; receive notifications |

Soft deletes (`is_deleted`) keep historical rows; queries should filter `is_deleted = 0`.

---

## Deployment (Vercel + Aiven)

Production backend is a Vercel serverless function talking to **Aiven MySQL**. Full steps: [`backend/README.md`](backend/README.md#deploy-to-vercel--aiven).

1. Create Aiven MySQL 8; allow `0.0.0.0/0`; copy Service URI (`ssl-mode=REQUIRED`).
2. From `backend/`: `npx prisma migrate deploy` with `DATABASE_URL` set to that URI.
3. In Vercel: import the repo, **Root Directory = `backend`**, paste vars from [`backend/.env.vercel.example`](backend/.env.vercel.example).
4. Confirm `https://<api>.vercel.app/api/health` returns `db: up`.

The GitHub [deploy workflow](.github/workflows/deploy.yml) only applies Prisma migrations when `secrets.DATABASE_URL` is set. Vercel Git integration deploys the API.

### CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on push/PR:

- **Backend:** `npm ci` → lint → test → build  
- **Frontend:** `npm ci` → production build  

Requires `package-lock.json` in each package for `npm ci`.

---

## Useful commands

```bash
# Infra
docker compose up -d mysql redis
docker compose logs -f mysql

# Backend
cd backend && npm run start:dev
cd backend && npm run lint && npm test && npm run build

# Frontend
cd frontend && npm start
cd frontend && npm run build
```

---

## License

UNLICENSED — private Offer Lanka project.
