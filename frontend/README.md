# Offer Lanka Frontend

Angular 18 SaaS frontend for **Offer Lanka** — Sri Lanka's offers marketplace.

## Stack

- Angular 18 (standalone components)
- Angular Material + CDK
- Tailwind CSS
- RxJS
- Firebase Auth config stubs (`@angular/fire` / `firebase`)
- JWT auth via `localStorage` + HTTP interceptors

## Setup

```bash
npm install
npm start
```

API base URL: `http://localhost:3000/api` (see `src/environments/environment.ts`).

## Demo auth (offline fallback)

When the backend is unreachable, login/register still work with a demo JWT:

- Email containing `admin` → admin role (`/admin`)
- Email containing `business` → business role (`/business`)
- Otherwise → user role
