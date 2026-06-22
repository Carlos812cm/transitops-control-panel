# TransitOps Production Readiness

## Purpose

This document defines the minimum checklist required to prepare TransitOps Platform for a public demo deployment.

The goal is not to operate the project as a real production business system yet. The goal is to publish a stable, safe and professional portfolio demo using demo data.

## Target Deployment Type

Recommended target:

- Public Front-End demo
- Public Back-End API
- Demo PostgreSQL database
- Seeded demo data
- No real user data
- No real business data
- No committed secrets

## Current Status

TransitOps is ready for a production-readiness phase because it already includes:

- Angular production build command
- Express API build command
- PostgreSQL persistence
- Prisma ORM
- JWT authentication
- Role-based authorization
- CORS configuration
- Helmet middleware
- API validation with Zod
- API tests
- Release documentation
- Stable `v1.6.0` portfolio state

## Required Environment Variables

The API requires these variables in deployment:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime environment |
| `PORT` | API server port |
| `API_PREFIX` | API route prefix |
| `CLIENT_URL` | Allowed Front-End origin for CORS |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Token signing secret |
| `JWT_EXPIRES_IN` | Token expiration time |

## Front-End Requirements

Before deploying the Angular app:

- Replace the production API URL with the deployed API URL.
- Run a production build.
- Verify that authenticated API calls work against the deployed Back-End.
- Verify protected routes.
- Verify role-based UI behavior.
- Verify pagination on Vehicles, Drivers, Routes and Trips.

## Back-End Requirements

Before deploying the API:

- Configure production environment variables.
- Use a strong `JWT_SECRET`.
- Use a managed or secure PostgreSQL database.
- Run Prisma migrations.
- Run seed only with demo-safe data.
- Confirm CORS allows only the deployed Front-End URL.
- Confirm the API does not expose internal error details.
- Run API tests before deployment.

## Database Requirements

The demo database should:

- Use demo data only.
- Avoid real personal data.
- Use dedicated credentials.
- Have migrations applied.
- Be easy to reset if needed.
- Avoid exposing direct database credentials publicly.

## Security Checklist

Before publishing the demo:

- `.env` files are not committed.
- Real secrets are not present in the repository.
- `JWT_SECRET` is not a default placeholder.
- `DATABASE_URL` is configured only in the deployment provider.
- Demo users use controlled credentials.
- CORS is restricted to the deployed Front-End URL.
- Error responses do not leak stack traces.
- Admin demo access is intentional.

## Deployment Smoke Test

After deployment, validate:

- Front-End loads successfully.
- API health or root endpoint responds.
- Login works.
- Dashboard loads real API data.
- Vehicles list loads with pagination.
- Drivers list loads with pagination.
- Routes list loads with pagination.
- Trips list loads with pagination and relations.
- Protected actions respect roles.
- Viewer role remains read-only.
- Dark theme still works.
- English and Spanish UI still work.

## Production Demo Definition of Done

The demo is ready when:

- Public Front-End URL is available.
- Public API URL is available.
- Demo database is configured.
- Environment variables are configured in the hosting provider.
- Smoke test passes.
- README includes the live demo URL.
- No secrets are committed.
- The project can be explained in interviews as a deployed Full-Stack demo.
