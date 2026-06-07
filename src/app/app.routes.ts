// En este archivo se definen las rutas principales de la aplicación, organizadas en dos grupos: rutas protegidas por autenticación que utilizan el MainLayoutComponent y rutas públicas para la autenticación que utilizan el AuthLayoutComponent. Cada ruta protegida también tiene un guardia de roles para controlar el acceso según los roles de usuario definidos en la aplicación.

import { Routes } from '@angular/router';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { AuthGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'OPERATOR', 'SUPERVISOR', 'VIEWER'],
        },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN'],
        },
        loadComponent: () =>
          import('./features/admin/admin-home/admin-home.component').then(
            (m) => m.AdminHomeComponent,
          ),
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN'],
        },
        loadComponent: () =>
          import('./features/users/users-list/users-list.component').then(
            (m) => m.UsersListComponent,
          ),
      },
      {
        path: 'vehicles',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'OPERATOR', 'SUPERVISOR', 'VIEWER'],
        },
        loadComponent: () =>
          import('./features/vehicles/vehicles-list/vehicles-list.component').then(
            (m) => m.VehiclesListComponent,
          ),
      },
      {
        path: 'vehicles/new',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN'],
        },
        loadComponent: () =>
          import('./features/vehicles/vehicle-form/vehicle-form.component').then(
            (m) => m.VehicleFormComponent,
          ),
      },
      {
        path: 'drivers/new',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN'],
        },
        loadComponent: () =>
          import('./features/drivers/driver-form/driver-form.component').then(
            (m) => m.DriverFormComponent,
          ),
      },
      {
        path: 'drivers',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'OPERATOR', 'SUPERVISOR', 'VIEWER'],
        },
        loadComponent: () =>
          import('./features/drivers/drivers-list/drivers-list.component').then(
            (m) => m.DriversListComponent,
          ),
      },
      {
        path: 'routes/new',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN'],
        },
        loadComponent: () =>
          import('./features/routes/route-form/route-form.component').then(
            (m) => m.RouteFormComponent,
          ),
      },
      {
        path: 'routes',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'OPERATOR', 'SUPERVISOR', 'VIEWER'],
        },
        loadComponent: () =>
          import('./features/routes/routes-list/routes-list.component').then(
            (m) => m.RoutesListComponent,
          ),
      },
      {
        path: 'trips/new',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'OPERATOR', 'SUPERVISOR'],
        },
        loadComponent: () =>
          import('./features/trips/trip-form/trip-form.component').then((m) => m.TripFormComponent),
      },
      {
        path: 'trips',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'OPERATOR', 'SUPERVISOR', 'VIEWER'],
        },
        loadComponent: () =>
          import('./features/trips/trips-list/trips-list.component').then(
            (m) => m.TripsListComponent,
          ),
      },
      {
        path: 'settings',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'OPERATOR', 'SUPERVISOR', 'VIEWER'],
        },
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'access-denied',
        loadComponent: () =>
          import('./features/auth/access-denied/access-denied.component').then(
            (m) => m.AccessDeniedComponent,
          ),
      },
    ],
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
