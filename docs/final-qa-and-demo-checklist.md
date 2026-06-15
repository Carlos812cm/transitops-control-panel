# Final QA and Demo Checklist

This checklist validates TransitOps Control Panel before using it in a portfolio, interview or live demo.

## 1. Local environment

Run these commands from the repository root.

```bash
git checkout main
git pull
npm install
```

Install Back-End dependencies if needed:

```bash
cd server
npm install
cd ..
```

Start PostgreSQL:

```bash
docker start transitops_postgres
```

If the container does not exist:

```bash
docker compose -f server/docker-compose.yml up -d
```

Seed the database:

```bash
npm run api:real:seed
```

## 2. Quality gate

Run the full validation set:

```bash
npm run build
npm run test:api
npm run api:real:typecheck
npm run api:real:test
npm run api:real:build
```

Expected result:

```txt
All commands finish successfully.
Angular builds without errors.
Mock API tests pass.
Back-End typecheck passes.
Back-End route tests pass.
Back-End build passes.
```

## 3. Start the demo

Terminal 1:

```bash
npm run api:real
```

Expected API URL:

```txt
http://localhost:4000/api
```

Terminal 2:

```bash
npm start
```

Expected Front-End URL:

```txt
http://localhost:4200
```

## 4. Demo users

Use the seeded users to validate role-based behavior.

```txt
admin@transitops.com
operator@transitops.com
supervisor@transitops.com
viewer@transitops.com
```

Use the password configured in the project seed.

## 5. UI smoke test

Validate these screens:

```txt
/login
/register
/dashboard
/vehicles
/vehicles/new
/drivers
/drivers/new
/routes
/routes/new
/trips
/trips/new
/users
/settings
/access-denied
```

## 6. Functional checklist

### Authentication

- [ ] Login works with seeded demo users.
- [ ] Invalid credentials show an error message.
- [ ] Register screen renders correctly.
- [ ] Registration validation messages work.
- [ ] Registration success state renders correctly.
- [ ] Protected routes redirect unauthenticated users.

### Dashboard

- [ ] Dashboard loads real summary metrics.
- [ ] Latest trips render with vehicle, driver and route information.
- [ ] Command center layout is readable in light theme.
- [ ] Command center layout is readable in dark theme.

### Vehicles

- [ ] Vehicles list loads records.
- [ ] Search filter works.
- [ ] Status filter works.
- [ ] Create vehicle form validates required fields.
- [ ] Admin can create or update vehicles.
- [ ] Viewer cannot execute protected actions.

### Drivers

- [ ] Drivers list loads records.
- [ ] Search filter works.
- [ ] Status filter works.
- [ ] Create driver form validates required fields.
- [ ] Admin can create or update drivers.
- [ ] Viewer cannot execute protected actions.

### Routes

- [ ] Routes list loads records.
- [ ] Search filter works.
- [ ] Status filter works.
- [ ] Create route form validates required fields.
- [ ] Admin can create or update routes.
- [ ] Viewer cannot execute protected actions.

### Trips

- [ ] Trips list loads records with relations.
- [ ] Search filter works.
- [ ] Status filter works.
- [ ] Create trip form loads available vehicles, active drivers and active routes.
- [ ] Trip scheduling rejects unavailable resources.
- [ ] Trip status actions follow business rules.
- [ ] Viewer cannot execute protected actions.

### Users

- [ ] Users list is accessible to Admin.
- [ ] Users list is blocked for non-admin roles.
- [ ] User approval flow works.
- [ ] User rejection flow works.
- [ ] User status actions work.
- [ ] Users summary cards render correctly.

### Settings

- [ ] Language settings render correctly.
- [ ] English can be selected.
- [ ] Spanish can be selected.
- [ ] Selected language is clearly marked.
- [ ] Language preference updates UI text.

## 7. Responsive checklist

Validate at these widths:

```txt
Desktop: 1440px
Laptop: 1024px
Tablet: 768px
Mobile: 390px
```

Check:

- [ ] Sidebar behaves correctly.
- [ ] Navbar remains readable.
- [ ] Tables remain usable.
- [ ] Forms remain usable.
- [ ] Auth screens remain readable.
- [ ] Settings layout stacks correctly.
- [ ] Action buttons do not overflow.

## 8. Theme checklist

Validate both themes:

- [ ] Light theme.
- [ ] Dark theme.

Check:

- [ ] Text contrast is readable.
- [ ] Buttons are visible.
- [ ] Inputs are visible.
- [ ] Tables are readable.
- [ ] Status badges are readable.
- [ ] Empty states are readable.
- [ ] Login/Register screens are readable.

## 9. Recommended live demo flow

Use this order during an interview or portfolio walkthrough:

```txt
1. Login as Admin.
2. Open Dashboard and explain operational metrics.
3. Open Vehicles and show filters/status actions.
4. Open Drivers and show filters/status actions.
5. Open Routes and show route metrics.
6. Open Trips and explain relationships between vehicle, driver and route.
7. Create a Trip and explain business rules.
8. Open Users and explain role-based access.
9. Open Settings and switch language.
10. Login as Viewer and show read-only behavior.
11. Explain Back-End architecture and Prisma/PostgreSQL persistence.
```

## 10. Interview explanation

Suggested short explanation:

```txt
TransitOps Platform is a full-stack transportation operations system. It uses Angular for a role-aware administrative control panel, Express for the REST API, Prisma for database access and PostgreSQL for persistence. The system manages users, vehicles, drivers, routes and trips, enforcing authentication, authorization and business rules for trip scheduling.
```

Suggested technical highlights:

```txt
- Angular standalone components and feature-based organization.
- Reactive Forms with validation.
- Role-based route and UI behavior.
- REST API integration with typed services.
- Express modular Back-End.
- Prisma ORM with PostgreSQL.
- JWT authentication and role authorization.
- Zod request validation.
- Back-End route tests with Vitest.
- Mock API fallback for Front-End development.
- Light/dark theme and English/Spanish UI support.
```

## 11. Final status

If every item passes, the project is ready for:

```txt
- GitHub portfolio presentation
- Recruiter review
- Technical interview demo
- LinkedIn project post
- CV project section
```
