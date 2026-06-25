# TransitOps Control Panel

English | [Español](README.es.md)

TransitOps Control Panel is a Full-Stack transportation operations platform built with Angular, Express, Prisma and PostgreSQL.

It provides a role-aware administrative interface to manage users, vehicles, drivers, routes and trips through a real REST API. The project also keeps a local mock API as a lightweight Front-End fallback.

Current stable version: `v1.8.0`

---

## Live Demo

| Resource | URL |
| --- | --- |
| Public Front-End demo | https://transitops-control-panel.onrender.com |
| Public API health check | https://transitops-api.onrender.com/api/health |
| Public API base URL | https://transitops-api.onrender.com/api |

Demo accounts:

| Role | Email | Password | Purpose |
| --- | --- | --- | --- |
| `ADMIN` | `admin@transitops.com` | `admin123` | Full demo access |
| `OPERATOR` | `operator@transitops.com` | `operator123` | Operational trip workflow |
| `SUPERVISOR` | `supervisor@transitops.com` | `supervisor123` | Operational trip workflow |
| `VIEWER` | `viewer@transitops.com` | `viewer123` | Read-only validation |

> These credentials are for a controlled demo database only. Do not reuse them in real systems.

---

## Project Purpose

This project presents a realistic administrative system for transportation operations. It demonstrates:

- Angular administrative dashboard architecture.
- Real REST API integration.
- PostgreSQL persistence through Prisma.
- Authentication and role-based authorization.
- Users management workflow.
- Vehicles, drivers, routes and trips operations.
- Dashboard metrics from real API data.
- Business rules for trip scheduling.
- Paginated API responses with Front-End pagination controls.
- Light and dark theme support.
- English and Spanish UI language support.
- Public Full-Stack demo deployment with Render and Supabase.
- Local mock API fallback.

The project can be explained as a Full-Stack system, or separated into Front-End and Back-End narratives for interviews.

---

## Portfolio Review

Use these documents to validate and present the project:

| Document | Purpose |
| --- | --- |
| [`docs/final-qa-and-demo-checklist.md`](docs/final-qa-and-demo-checklist.md) | Final QA, responsive checks, theme checks and interview demo flow |
| [`docs/real-api-smoke-test.md`](docs/real-api-smoke-test.md) | Full local validation guide for PostgreSQL, API and Angular |
| [`docs/releases/v1.8.0-demo-deployment.md`](docs/releases/v1.8.0-demo-deployment.md) | Public demo deployment release notes |
| [`README.es.md`](README.es.md) | Spanish version for local portfolio and interview preparation |

Recommended portfolio flow:

```txt
1. Open the public Front-End demo.
2. Sign in with the ADMIN demo account.
3. Show Dashboard metrics and operational modules.
4. Validate role-based behavior with the VIEWER account.
5. Explain the API, database and deployment architecture.
6. Open the repository and walk through the code structure.
```

---

## Tech Stack

| Technology | Purpose |
| --- | --- |
| Angular 21 | Front-End framework |
| TypeScript | Typed application logic |
| Bootstrap 5 | UI layout and components |
| SCSS | Custom styling |
| Angular Router | Client-side routing |
| Angular HttpClient | REST communication |
| Reactive Forms | Forms and validation |
| RxJS | Async data handling |
| Express | Real API and local mock API |
| Prisma | Database ORM |
| PostgreSQL | Relational database |
| Supabase PostgreSQL | Public demo database |
| Render | Public demo hosting |
| Docker | Local database container |
| Zod | Back-End validation |
| Vitest | API tests |

---

## Main Features

- Login and session handling.
- Protected application routes.
- Role-based UI behavior.
- Dashboard summary with operational metrics.
- Admin users management.
- Vehicles management.
- Drivers management.
- Routes management.
- Trips management.
- Real Back-End business rules.
- Table search and status filters.
- API pagination metadata.
- Front-End pagination controls for operational lists.
- Loading, empty and error states.
- Light and dark theme.
- English and Spanish UI preference.
- Public demo deployment connected to a real database.

---

## Roles

| Role | Access Level |
| --- | --- |
| `ADMIN` | Full administrative access |
| `OPERATOR` | Operational access for trip management |
| `SUPERVISOR` | Operational access for trip management |
| `VIEWER` | Read-only access |

---

## Business Rules

The API enforces these rules:

- Only authenticated users can access protected resources.
- Only available vehicles can be assigned to trips.
- Only active drivers can be assigned to trips.
- Only active routes can be assigned to trips.
- Viewer users can consult data only.
- Administrative actions are restricted by role.
- Users that are not active cannot sign in.
- Only administrators can manage users.
- Resources with related trips are protected from deletion.

---

## Application Routes

| Route | Description | Access |
| --- | --- | --- |
| `/login` | Login screen | Public |
| `/register` | Registration screen | Public |
| `/dashboard` | Operational dashboard | Authenticated users |
| `/vehicles` | Vehicle management | Authenticated users |
| `/vehicles/new` | Create vehicle | `ADMIN` |
| `/drivers` | Driver management | Authenticated users |
| `/drivers/new` | Create driver | `ADMIN` |
| `/routes` | Route management | Authenticated users |
| `/routes/new` | Create route | `ADMIN` |
| `/trips` | Trip management | Authenticated users |
| `/trips/new` | Create trip | `ADMIN`, `OPERATOR`, `SUPERVISOR` |
| `/users` | Users management | `ADMIN` |
| `/settings` | Settings and language | Authenticated users |
| `/access-denied` | Unauthorized access screen | Authenticated users |

---

## API Base URLs

Public demo API:

```txt
https://transitops-api.onrender.com/api
```

Local development API:

```txt
http://localhost:4000/api
```

Configured in:

```txt
src/environments/environment.ts
src/environments/environment.development.ts
```

---

## Main API Endpoints

List endpoints support pagination and filters through query parameters such as:

```txt
?page=1&limit=10&search=term&status=ACTIVE
```

### Health

```txt
GET /api/health
```

### Dashboard

```txt
GET /api/dashboard/summary
```

### Auth

```txt
POST /api/auth/login
GET  /api/auth/profile
```

### Users

```txt
GET   /api/users
GET   /api/users/:id
PATCH /api/users/:id/approve
PATCH /api/users/:id/reject
PATCH /api/users/:id/status
```

### Vehicles

```txt
GET    /api/vehicles
GET    /api/vehicles/:id
POST   /api/vehicles
PATCH  /api/vehicles/:id
PATCH  /api/vehicles/:id/status
DELETE /api/vehicles/:id
```

### Drivers

```txt
GET    /api/drivers
GET    /api/drivers/:id
POST   /api/drivers
PATCH  /api/drivers/:id
PATCH  /api/drivers/:id/status
DELETE /api/drivers/:id
```

### Routes

```txt
GET    /api/routes
GET    /api/routes/:id
POST   /api/routes
PATCH  /api/routes/:id
PATCH  /api/routes/:id/status
DELETE /api/routes/:id
```

### Trips

```txt
GET    /api/trips
GET    /api/trips/:id
POST   /api/trips
PATCH  /api/trips/:id/status
DELETE /api/trips/:id
```

---

## Local Installation

Install root dependencies:

```bash
npm install
```

Install Back-End dependencies:

```bash
cd server
npm install
cd ..
```

Start PostgreSQL:

```bash
docker start transitops_postgres
```

If the database container does not exist yet:

```bash
docker compose -f server/docker-compose.yml up -d
```

Seed the database:

```bash
npm run api:real:seed
```

Start the real API:

```bash
npm run api:real
```

Start Angular:

```bash
npm start
```

Open:

```txt
http://localhost:4200
```

---

## Demo Deployment Overview

The public demo uses:

| Layer | Provider | Notes |
| --- | --- | --- |
| Database | Supabase PostgreSQL | Dedicated demo database with Prisma migrations and seed data |
| Back-End | Render Web Service | Express API deployed from `server` |
| Front-End | Render Web Service | Angular SSR/hybrid build deployed from the repository root |

Deployment safety rules:

- Secrets are configured only in Render and Supabase.
- `DATABASE_URL` and `JWT_SECRET` are not committed.
- Demo seed data must only be used with a dedicated demo database.
- CORS must allow the public Front-End URL through `CLIENT_URL` in the API service.

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm start` | Starts Angular on port 4200 |
| `npm run build` | Builds the Angular application |
| `npm test` | Runs Angular tests |
| `npm run api` | Starts the local mock API on port 4000 |
| `npm run api:dev` | Starts the mock API with watch mode |
| `npm run test:api` | Runs mock API tests |
| `npm run api:real` | Starts the real Express API |
| `npm run api:real:seed` | Seeds the PostgreSQL database |
| `npm run api:real:typecheck` | Runs Back-End TypeScript checks |
| `npm run api:real:test` | Runs real Back-End tests |
| `npm run api:real:build` | Builds the real Back-End API |
| `npm run deploy:web:build` | Builds Angular for deployment |
| `npm run deploy:api:build` | Builds the API for deployment |

---

## Real API Smoke Test

A complete local validation guide is available at:

```txt
docs/real-api-smoke-test.md
```

Recommended local validation:

```bash
npm run build
npm run test:api
npm run api:real:typecheck
npm run api:real:test
npm run api:real:build
```

Recommended public validation:

```txt
1. Open https://transitops-api.onrender.com/api/health.
2. Sign in from the public Front-End demo.
3. Validate Dashboard, Vehicles, Drivers, Routes and Trips.
4. Validate VIEWER read-only behavior.
5. Refresh a protected route such as /dashboard.
```

---

## Final QA and Demo Checklist

Before using the project in a portfolio, recruiter review or interview, validate the full experience with:

```txt
docs/final-qa-and-demo-checklist.md
```

This checklist covers:

- Local environment setup.
- Quality gate commands.
- UI smoke test routes.
- Functional validation by module.
- Responsive checks.
- Light and dark theme checks.
- Recommended live demo flow.
- Short interview explanation.

---

## Demo Flow

Recommended order for a live demo:

```txt
1. Open the public demo URL.
2. Login with the ADMIN demo account.
3. Show Dashboard metrics.
4. Show Vehicles, Drivers, Routes and Trips.
5. Demonstrate trip business rules.
6. Show Users management.
7. Login with VIEWER and validate read-only behavior.
8. Explain API, Prisma schema and deployment architecture.
9. Walk through code architecture.
```

Suggested explanation:

> TransitOps Platform is a Full-Stack administrative system for transportation operations. It uses Angular for the control panel, Express for the API, Prisma for database access and PostgreSQL for persistence. The public demo is deployed with Render and Supabase, and it manages users, vehicles, drivers, routes and trips with authentication, role-based access, paginated operational lists and business rules enforced by the API.

Key points to show:

- Dashboard metrics come from the real API.
- Vehicles, drivers, routes and trips use paginated API responses.
- Trips connect vehicles, drivers and routes.
- The API rejects trips with unavailable resources.
- Viewer users can read data but cannot perform protected actions.
- Admin users can manage operational resources and users.

---

## Interview Checklist

Before presenting the project:

```txt
[ ] Public Front-End demo is available
[ ] Public API health endpoint responds successfully
[ ] Login works with ADMIN credentials
[ ] Dashboard loads real data
[ ] Vehicles list loads records and pagination controls
[ ] Drivers list loads records and pagination controls
[ ] Routes list loads records and pagination controls
[ ] Trips list loads records with relations and pagination controls
[ ] VIEWER read-only behavior is validated
[ ] Protected route refresh works
[ ] Final QA and Demo Checklist was completed
[ ] README and release notes are updated
```

---

## Architecture Highlights

This project demonstrates:

- Feature-based Angular organization.
- Standalone Angular components.
- Typed API models.
- Guards for authentication and authorization.
- HTTP interceptors for token handling and global errors.
- Reactive forms with validation.
- Reusable UI components for shared behaviors such as pagination.
- Real REST API with Express and Prisma.
- PostgreSQL relational data model.
- Role-based Back-End authorization.
- Zod request validation.
- Paginated API contracts with response metadata.
- Back-End route tests with Vitest.
- Local mock API for independent Front-End fallback testing.
- Public demo deployment with Render and Supabase.

---

## Current Status

Implemented:

- Angular control panel.
- Real Express Back-End API.
- PostgreSQL database with Prisma ORM.
- Public demo database on Supabase PostgreSQL.
- Public API deployment on Render.
- Public Angular deployment on Render.
- Real dashboard summary endpoint.
- Real API endpoints for users, vehicles, drivers, routes and trips.
- Users management workflow.
- Trip scheduling business rules.
- API pagination metadata.
- Front-End pagination UI for operational lists.
- Back-End route tests.
- Local mock API fallback.
- Full local smoke test guide.
- Final QA and demo checklist.
- Demo flow and interview checklist.

Possible future improvements:

- Edit forms.
- Detail pages.
- Toast notifications.
- E2E tests.
- Dashboard charts.
- CI/CD hardening and deployment observability.

---

## Author

Carlos.

Project: TransitOps Platform  
Layer: Full-Stack Control Panel  
Focus: Angular administrative system, REST API integration, PostgreSQL persistence and role-based operations