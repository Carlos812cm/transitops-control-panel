# TransitOps Front-End Deployment

## Purpose

This document defines the deployment preparation steps for the Angular Front-End of TransitOps Platform.

The Front-End should be deployed only after the Back-End API has a public URL.

## Production API URL

The production Angular build uses:
`src/environments/environment.ts`

Before deploying the Front-End, update `apiUrl` with the deployed Back-End API URL.

Example:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-transitops-api.example.com/api',
};
```

> **Warning**
> Do not use `http://localhost:4000/api` in a public deployment.

### Development API URL

Local development uses:
`src/environments/environment.development.ts`

This file can continue pointing to:
`http://localhost:4000/api`

## Recommended Deployment Order

1. Deploy PostgreSQL demo database.
2. Configure API environment variables.
3. Deploy Back-End API.
4. Run database migrations.
5. Seed demo data.
6. Confirm API public URL works.
7. Update `src/environments/environment.ts` with the public API URL.
8. Build Angular.
9. Deploy Front-End.
10. Run the public smoke test.

## Build Command

```bash
npm run build
```

## Front-End Smoke Test

After deployment, validate:
- Login screen loads.
- Login works with demo credentials.
- Dashboard loads API data.
- Vehicles list loads with pagination.
- Drivers list loads with pagination.
- Routes list loads with pagination.
- Trips list loads with pagination and relations.
- Protected routes still work.
- Viewer role remains read-only.
- Theme switch works.
- Language preference works.

## Definition of Done

The Front-End deployment is ready when:
- The public app URL loads successfully.
- The app points to the public API URL.
- No production request points to localhost.
- Authenticated API requests work.
- Main pages pass smoke testing.
- README includes the public demo URL.
