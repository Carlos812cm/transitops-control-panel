# Real API Smoke Test

This guide validates the full local TransitOps Platform demo using PostgreSQL, the real Express API and the Angular Control Panel.

## 1. Start PostgreSQL

From the repository root:

```powershell
docker start transitops_postgres
```

If the container does not exist yet:

```powershell
docker compose -f server/docker-compose.yml up -d
```

Validate the database connection:

```powershell
docker exec transitops_postgres psql -U postgres -d transitops_platform_db -c "SELECT 1;"
```

## 2. Seed the database

```powershell
npm run api:real:seed
```

The seed creates demo users for `ADMIN`, `OPERATOR`, `SUPERVISOR` and `VIEWER` roles.

## 3. Validate the Back-End

```powershell
npm run api:real:typecheck
npm run api:real:test
npm run api:real:build
```

## 4. Start the real API

Terminal 1:

```powershell
npm run api:real
```

Expected API URL:

```txt
http://localhost:4000/api
```

Health check:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

## 5. Start Angular

Terminal 2:

```powershell
npm start
```

Open:

```txt
http://localhost:4200
```

## 6. Validate the UI

Check these sections:

```txt
Dashboard
Users
Vehicles
Drivers
Routes
Trips
Settings
```

Expected behavior:

- Dashboard loads real aggregated metrics.
- Latest trips include vehicle, driver and route data.
- Vehicles, drivers, routes and trips load database records.
- Admin users can create and update operational resources.
- Viewer users can read data but cannot execute protected actions.
- Business rules reject invalid trip scheduling.

## 7. Final validation

From the repository root:

```powershell
npm run build
npm run test:api
npm run api:real:typecheck
npm run api:real:test
npm run api:real:build
```

If all commands pass, the local Full-Stack demo is ready.
