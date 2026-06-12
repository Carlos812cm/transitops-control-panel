# TransitOps API

Real Back-End API workspace for TransitOps Platform.

This folder contains the production-oriented API that will gradually replace the local mock API used during Front-End development.

## Current structure

```txt
server/
├── mock/              # Existing mock API used by the Angular Front-End
├── prisma/            # Prisma schema, migrations and seed data
├── src/               # Real Express + TypeScript API
├── docker-compose.yml # Local PostgreSQL service
├── package.json       # Back-End scripts and dependencies
└── tsconfig.json      # TypeScript configuration
```

## Current Back-End stack

- Node.js
- Express
- TypeScript
- Prisma ORM 7
- PostgreSQL
- bcrypt
- Zod
- Helmet
- CORS
- Vitest
- Supertest

## Available scripts

Run these commands from the `server/` folder.

```bash
npm run dev
npm run build
npm run typecheck
npm run test
npm run seed
```

## Local database

The local PostgreSQL database is managed with Docker Compose.

```bash
docker compose up -d
```

Default local connection:

```txt
postgresql://postgres:postgres@localhost:5432/transitops_platform_db?schema=public
```

Use `.env.example` as a reference and create a local `.env` file.

## API conventions

The real API must preserve the current Front-End contracts initially:

- Base path: `/api`
- Standard success response: `{ success, message, data }`
- Standard error response: `{ success, message, errors? }`
- Vehicle identifier field: `unitNumber`
- Roles: `ADMIN`, `OPERATOR`, `SUPERVISOR`, `VIEWER`
- User statuses: `ACTIVE`, `INACTIVE`, `PENDING_APPROVAL`, `REJECTED`, `SUSPENDED`

## Current modules

```txt
src/
├── common/
│   ├── errors/
│   ├── middlewares/
│   ├── responses/
│   └── utils/
├── config/
├── modules/
│   └── health/
├── routes/
├── app.ts
└── server.ts
```

## Current endpoints

```txt
GET /api/health
```

## Mock API note

The mock API remains available under `server/mock/` so the Angular Front-End can continue being tested independently while the real API is built module by module.
