# TransitOps Control Panel

TransitOps Control Panel is an Angular administrative dashboard for transportation operations. It provides a role-aware interface to manage vehicles, drivers, routes and trips through a REST API.

This repository represents the Front-End layer of the TransitOps Platform portfolio project. It is designed to demonstrate professional Angular architecture, typed API integration, authentication, role-based UI behavior, reactive forms, dashboard metrics, table filters and responsive layout.

---

## Project Purpose

The goal of this project is to present a realistic Front-End administrative system rather than a static dashboard. The application includes operational workflows that are common in internal business platforms:

- Authentication and session handling
- Protected routes
- Role-based navigation and actions
- REST API integration through typed services
- Reactive forms with validation
- Entity status management
- Table searching and filtering
- Loading, empty and error states
- Responsive admin layout
- Local mock API for independent Front-End testing

The project can be used in interview scenarios as a Front-End Angular project, or as the UI layer of a wider Full-Stack TransitOps Platform.

---

## Tech Stack

| Technology         | Purpose                                |
| ------------------ | -------------------------------------- |
| Angular 21         | Main Front-End framework               |
| TypeScript         | Strongly typed application logic       |
| Bootstrap 5        | Layout and UI components               |
| SCSS               | Custom styling                         |
| Angular Router     | Client-side routing                    |
| Angular HttpClient | REST API communication                 |
| Reactive Forms     | Form handling and validation           |
| RxJS               | Async data handling                    |
| Express            | Local mock API for development/testing |
| Vitest             | Mock API tests                         |

---

## Main Features

### Authentication

- Login screen
- JWT-like token storage
- Current user session persistence
- Logout flow
- Route protection through `AuthGuard`
- Automatic token injection through `authInterceptor`
- Global 401/403 handling through `errorInterceptor`

### Role-Based UI

The application supports the following roles:

| Role         | Access Level                           |
| ------------ | -------------------------------------- |
| `ADMIN`      | Full administrative access             |
| `OPERATOR`   | Operational access for trip management |
| `SUPERVISOR` | Operational access for trip management |
| `VIEWER`     | Read-only access                       |

Role-based behavior includes:

- Hidden action buttons for unauthorized users
- Protected creation routes
- Read-only table actions for viewer users
- Reusable `appHasRole` structural directive

Example:

```html
<button *appHasRole="['ADMIN']">Create Vehicle</button>
```

### Dashboard

The dashboard calculates operational metrics from real API responses:

- Total vehicles
- Available vehicles
- Vehicles in maintenance
- Active drivers
- Suspended drivers
- Active routes
- Trips by status
- Latest trips
- Quick navigation actions

### Vehicles Module

Features:

- Vehicle list
- Search by unit number, brand or model
- Status filter
- Create vehicle form
- Change vehicle status
- Role-based actions
- Loading, error and empty states

Supported statuses:

```txt
AVAILABLE
MAINTENANCE
INACTIVE
```

### Drivers Module

Features:

- Driver list
- Search by name, license, email or phone
- Status filter
- Create driver form
- Change driver status
- Role-based actions
- Loading, error and empty states

Supported statuses:

```txt
ACTIVE
SUSPENDED
INACTIVE
```

### Routes Module

Features:

- Route list
- Search by name, origin or destination
- Status filter
- Create route form
- Change route status
- Role-based actions
- Loading, error and empty states

Supported statuses:

```txt
ACTIVE
INACTIVE
```

### Trips Module

Features:

- Trip list
- Search by vehicle, driver, route or notes
- Status filter
- Create trip form
- Load available vehicles
- Load active drivers
- Load active routes
- Change trip status
- Display Back-End business rule errors
- Role-based actions

Supported statuses:

```txt
SCHEDULED
IN_PROGRESS
COMPLETED
CANCELLED
```

Supported UI transitions:

```txt
SCHEDULED   -> IN_PROGRESS
SCHEDULED   -> CANCELLED
IN_PROGRESS -> COMPLETED
IN_PROGRESS -> CANCELLED
```

---

## Business Rules

The Front-End helps users select valid data, but the API remains responsible for final validation.

Main rules represented in the UI and mock API:

- Only authenticated users can access protected resources.
- Only available vehicles can be assigned to trips.
- Only active drivers can be assigned to trips.
- Only active routes can be assigned to trips.
- Viewer users can consult data only.
- Administrative actions are restricted by role.
- Trip status transitions depend on the current trip status.

---

## Application Routes

| Route            | Description                | Access                            |
| ---------------- | -------------------------- | --------------------------------- |
| `/login`         | Login screen               | Public                            |
| `/dashboard`     | Operational dashboard      | Authenticated users               |
| `/vehicles`      | Vehicle management         | Authenticated users               |
| `/vehicles/new`  | Create vehicle             | `ADMIN`                           |
| `/drivers`       | Driver management          | Authenticated users               |
| `/drivers/new`   | Create driver              | `ADMIN`                           |
| `/routes`        | Route management           | Authenticated users               |
| `/routes/new`    | Create route               | `ADMIN`                           |
| `/trips`         | Trip management            | Authenticated users               |
| `/trips/new`     | Create trip                | `ADMIN`, `OPERATOR`, `SUPERVISOR` |
| `/admin`         | Admin-only demo area       | `ADMIN`                           |
| `/access-denied` | Unauthorized access screen | Authenticated users               |

---

## Project Structure

```txt
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── models/
│   │   └── services/
│   ├── features/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── vehicles/
│   │   ├── drivers/
│   │   ├── routes/
│   │   └── trips/
│   ├── layout/
│   │   ├── auth-layout/
│   │   ├── main-layout/
│   │   ├── navbar/
│   │   └── sidebar/
│   ├── shared/
│   │   ├── components/
│   │   └── directives/
│   ├── app.config.ts
│   └── app.routes.ts
├── environments/
└── styles.scss
```

---

## Core Layer

The `core` layer contains application-wide logic.

| File                   | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `auth.guard.ts`        | Protects private routes                      |
| `role.guard.ts`        | Restricts routes by user role                |
| `auth.interceptor.ts`  | Adds the token to API requests               |
| `error.interceptor.ts` | Handles unauthorized and forbidden responses |
| `auth.service.ts`      | Handles login, logout and user session       |
| `vehicles.service.ts`  | Vehicle API operations                       |
| `drivers.service.ts`   | Driver API operations                        |
| `routes.service.ts`    | Route API operations                         |
| `trips.service.ts`     | Trip API operations                          |

The application uses TypeScript interfaces and union types to define API contracts and valid status values.

Example:

```ts
export type TripStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
```

---

## Shared Layer

Reusable UI elements live in the `shared` layer.

| Component/Directive       | Purpose                               |
| ------------------------- | ------------------------------------- |
| `PageHeaderComponent`     | Standard page title and action button |
| `StatusBadgeComponent`    | Visual status labels                  |
| `LoadingSpinnerComponent` | Loading state                         |
| `EmptyStateComponent`     | Empty data state                      |
| `HasRoleDirective`        | Shows or hides elements by role       |

---

## API Integration

The application expects an API at:

```txt
http://localhost:4000/api
```

Configured in:

```txt
src/environments/environment.development.ts
```

Expected success response:

```json
{
  "success": true,
  "message": "Trips retrieved successfully",
  "data": []
}
```

Expected error response:

```json
{
  "success": false,
  "message": "Vehicle must be AVAILABLE to schedule a trip."
}
```

---

## Local Mock API

This repository includes a small Express mock API in the `server/` folder. It allows the Front-End to run independently for local testing and portfolio demonstrations.

Start the mock API:

```bash
npm run api
```

Development mode with watch:

```bash
npm run api:dev
```

Health check:

```txt
GET http://localhost:4000/api/health
```

The mock API includes sample data, authentication, authorization checks, entity CRUD operations and trip business rules.

---

## Main API Endpoints

### Auth

```txt
POST /api/auth/login
GET  /api/auth/profile
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

## Demo Users

| Role         | Email                       | Password        |
| ------------ | --------------------------- | --------------- |
| `ADMIN`      | `admin@transitops.com`      | `admin123`      |
| `OPERATOR`   | `operator@transitops.com`   | `operator123`   |
| `SUPERVISOR` | `supervisor@transitops.com` | `supervisor123` |
| `VIEWER`     | `viewer@transitops.com`     | `viewer123`     |

---

## Installation

Install dependencies:

```bash
npm install
```

Run the mock API in one terminal:

```bash
npm run api
```

Run the Angular application in another terminal:

```bash
npm start
```

Open the application:

```txt
http://localhost:4200
```

---

## Available Scripts

| Command            | Description                            |
| ------------------ | -------------------------------------- |
| `npm start`        | Starts Angular on port 4200            |
| `npm run api`      | Starts the local mock API on port 4000 |
| `npm run api:dev`  | Starts the mock API with watch mode    |
| `npm run build`    | Builds the Angular application         |
| `npm test`         | Runs Angular tests                     |
| `npm run test:api` | Runs mock API tests                    |

---

## Recommended Screenshots

Use the `docs/screenshots/` folder for portfolio images.

Suggested screenshots:

```txt
docs/screenshots/login.png
docs/screenshots/dashboard.png
docs/screenshots/vehicles.png
docs/screenshots/drivers.png
docs/screenshots/routes.png
docs/screenshots/trips.png
docs/screenshots/trip-form.png
docs/screenshots/access-denied.png
docs/screenshots/mobile-sidebar.png
```

---

## Architecture Highlights

This project demonstrates:

- Feature-based Angular organization
- Standalone Angular components
- Typed API models
- Reusable UI components
- Guards for authentication and authorization
- HTTP interceptors for token handling and global errors
- Structural directive for role-based rendering
- Reactive forms with validation
- Local table filtering
- Status transitions from administrative tables
- Responsive layout with mobile sidebar
- Local mock API for independent testing

---

## Interview Explanation

A concise explanation for interviews:

> TransitOps Control Panel is an Angular administrative dashboard for transportation operations. It consumes a REST API to manage vehicles, drivers, routes and trips. I implemented authentication, protected routes, role-based UI actions, reusable components, reactive forms, typed HTTP services, table filters, status transitions and a responsive layout.

A more technical explanation:

> The application uses Angular standalone components, Angular Router, HttpClient and RxJS. Domain communication is separated into services such as VehiclesService, DriversService, RoutesService and TripsService. Authentication is handled through AuthService, with a local token automatically attached to requests through an HTTP interceptor. I also implemented guards for authentication and role validation, plus a reusable structural directive to hide UI elements based on the current user role.

Business-focused explanation:

> The system helps transportation administrators monitor operational resources, manage vehicle and driver availability, configure routes and schedule trips. The UI prevents invalid selections where possible, while the API enforces the final business rules, such as preventing trips with unavailable vehicles, suspended drivers or inactive routes.

---

## Current Status

Implemented:

- Authentication UI
- Protected admin layout
- Responsive sidebar and navbar
- Dashboard with calculated metrics
- Vehicle list, creation and status updates
- Driver list, creation and status updates
- Route list, creation and status updates
- Trip list, creation and status updates
- Trip creation with related catalogs
- Role-based buttons and access control
- Search and status filters
- Loading, error and empty states
- Local mock API with tests

Possible future improvements:

- Edit forms
- Detail pages
- Server-side pagination
- Server-side search and filters
- Toast notifications
- More unit tests
- E2E tests
- Dashboard charts
- Deployment configuration

---

## Author

Developed as part of a professional Full-Stack portfolio project.

Project: TransitOps Platform  
Layer: Front-End Control Panel  
Focus: Angular administrative system, REST API integration and role-based operations
