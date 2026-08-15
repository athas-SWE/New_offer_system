# Offer Lanka Backend

NestJS + TypeORM + MySQL API. Schema migrations are Prisma; runtime queries are TypeORM.

## Quick start (local)

1. Copy env: `cp .env.example .env`
2. Install: `npm install`
3. Apply schema (local MySQL): `npx prisma migrate deploy`
4. Run: `npm run start:dev`
5. Swagger: http://localhost:3000/api/docs
6. Health: http://localhost:3000/api/health

Default seeded admin (on boot when `SEED_ON_BOOT` is not `false`):
- Email: `admin@offerlanka.lk`
- Password: `Admin@12345`

## Scripts

- `npm run start:dev` — watch mode
- `npm run build` / `npm run start:prod`
- `npm run prisma:migrate:deploy` — apply migrations (use this against Aiven)
- `npm test` — unit tests

---

## Deploy to Vercel + Aiven

The API runs as a **Vercel Node serverless function**. MySQL lives on **Aiven**. Set the Vercel project **Root Directory** to `backend`.

### 1. Aiven MySQL

1. Create a **MySQL** service (MySQL 8). Pick a region close to Vercel (e.g. Singapore / Mumbai).
2. Open **Overview → Allowed IP addresses** and allow `0.0.0.0/0` (Vercel IPs are dynamic). Restrict later if you add a static egress.
3. Copy **Service URI**. It looks like:

   `mysql://avnadmin:PASSWORD@mysql-xxxx.d.aivencloud.com:12345/defaultdb?ssl-mode=REQUIRED`

4. URL-encode any special characters in the password (`@`, `#`, `/`, `%`, etc.).
5. You can keep the `defaultdb` database name, or create `offer_lanka` and put that in the URL path.

Apply migrations **from your machine** (or GitHub Actions) before the first traffic:

```bash
cd backend
npx prisma migrate deploy
```

`DATABASE_URL` must be the Aiven URI (in `backend/.env` or the shell). SSL is required; TypeORM turns SSL on automatically for Aiven / Vercel / production.

Optional: after the first successful boot, set `SEED_ON_BOOT=false` in Vercel to skip seed queries on cold starts.

### 2. Vercel project

1. Import this Git repo in [Vercel](https://vercel.com/new).
2. **Root Directory:** `backend`
3. Framework Preset: **Other** (vercel.json sets `framework: null`)
4. Build Command: `npm run build` (already in `vercel.json`)
5. Add environment variables from [`.env.vercel.example`](.env.vercel.example)

Minimum secrets:

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Aiven Service URI with `ssl-mode=REQUIRED` |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Long random strings |
| `CORS_ORIGIN` | Frontend origin, e.g. `https://app.vercel.app` |
| `CLOUDINARY_*` | Image uploads |
| `FACEBOOK_TOKEN_ENCRYPTION_KEY` | Required if shops connect Facebook |

6. Deploy. Then open:

   - `https://<your-api>.vercel.app/api/health` — should return `{ "status": "ok", "db": "up" }`
   - `https://<your-api>.vercel.app/api/docs` — Swagger

Hobby plans cap function duration at **10s** (Pro allows 30s as configured). Cold starts + Aiven SSL can be tight on Hobby; upgrade if you see timeouts.

Vercel request body limit on Hobby is **~4.5 MB** (file uploads). `MAX_FILE_SIZE=4194304` is set in the Vercel env example.

### 3. GitHub Actions migrate (optional)

Repo secret `DATABASE_URL` = Aiven URI. On push to `main`, [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs `prisma migrate deploy`. App deploys via Vercel Git integration.

---

## Docker

`docker build -t offer-lanka-api .`
