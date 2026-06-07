# TransitOps Control Panel

[English](README.md) | Español

TransitOps Control Panel es un panel administrativo desarrollado con Angular para gestionar operaciones de transporte. Proporciona una interfaz con control por roles para administrar vehículos, conductores, rutas y viajes mediante una API REST.

Este repositorio representa la capa **Front-End** del proyecto de portafolio **TransitOps Platform**. Está diseñado para demostrar arquitectura Angular profesional, integración tipada con API, autenticación, comportamiento visual basado en roles, formularios reactivos, métricas operativas, filtros en tablas, diseño responsive y soporte de tema claro/oscuro.

---

## Propósito del proyecto

El objetivo de este proyecto es presentar un sistema administrativo realista, no solo un dashboard estático. La aplicación incluye flujos comunes en plataformas internas de negocio:

- Autenticación y manejo de sesión.
- Registro público con verificación simulada por correo y teléfono.
- Rutas protegidas.
- Navegación y acciones basadas en roles.
- Integración con API REST mediante servicios tipados.
- Formularios reactivos con validaciones.
- Gestión de estados por entidad.
- Búsqueda y filtrado en tablas.
- Estados de carga, error y datos vacíos.
- Layout administrativo responsive.
- Tema claro y tema oscuro con persistencia local.
- Página de configuración con cobertura ampliada de idioma inglés/español en la UI.
- Mock API local para probar el Front-End de forma independiente.

El proyecto puede presentarse en entrevistas como un proyecto **Front-End Angular**, o como la capa visual de una plataforma **Full-Stack** más amplia llamada TransitOps Platform.

---

## Stack tecnológico

| Tecnología         | Propósito                                |
| ------------------ | ---------------------------------------- |
| Angular 21         | Framework principal de Front-End         |
| TypeScript         | Lógica de aplicación fuertemente tipada  |
| Bootstrap 5        | Layout y componentes visuales            |
| SCSS               | Estilos personalizados                   |
| Angular Router     | Enrutamiento del lado del cliente        |
| Angular HttpClient | Comunicación con API REST                |
| Reactive Forms     | Manejo y validación de formularios       |
| RxJS               | Manejo de datos asíncronos               |
| Express            | Mock API local para desarrollo y pruebas |
| Vitest             | Pruebas de la mock API                   |

---

## Funcionalidades principales

### Autenticación

- Pantalla de login.
- Pantalla de registro público.
- Códigos simulados de verificación por correo y teléfono para desarrollo.
- Selección de rol solicitado para `VIEWER`, `OPERATOR` o `SUPERVISOR`.
- Almacenamiento de token tipo JWT.
- Persistencia de sesión del usuario actual.
- Flujo de cierre de sesión.
- Protección de rutas mediante `AuthGuard`.
- Inyección automática del token mediante `authInterceptor`.
- Manejo global de errores 401/403 mediante `errorInterceptor`.

### Interfaz basada en roles

La aplicación soporta los siguientes roles:

| Rol          | Nivel de acceso                         |
| ------------ | --------------------------------------- |
| `ADMIN`      | Acceso administrativo completo          |
| `OPERATOR`   | Acceso operativo para gestión de viajes |
| `SUPERVISOR` | Acceso operativo para gestión de viajes |
| `VIEWER`     | Acceso solo lectura                     |

El comportamiento basado en roles incluye:

- Botones ocultos para usuarios sin permisos.
- Rutas de creación protegidas.
- Acciones de tabla limitadas para usuarios de solo lectura.
- Directiva estructural reutilizable `appHasRole`.

Ejemplo:

```html
<button *appHasRole="['ADMIN']">Create Vehicle</button>
```

### Dashboard

El dashboard calcula métricas operativas desde respuestas reales de la API:

- Total de vehículos.
- Vehículos disponibles.
- Vehículos en mantenimiento.
- Conductores activos.
- Conductores suspendidos.
- Rutas activas.
- Viajes por estado.
- Últimos viajes.
- Acciones rápidas de navegación.

### Módulo de vehículos

- Lista de vehículos.
- Búsqueda por número de unidad, marca o modelo.
- Filtro por estado.
- Formulario de creación.
- Cambio de estado del vehículo.
- Acciones basadas en rol.
- Estados de carga, error y datos vacíos.

Estados soportados:

```txt
AVAILABLE
MAINTENANCE
INACTIVE
```

### Módulo de conductores

- Lista de conductores.
- Búsqueda por nombre, licencia, correo o teléfono.
- Filtro por estado.
- Formulario de creación.
- Cambio de estado del conductor.
- Acciones basadas en rol.
- Estados de carga, error y datos vacíos.

Estados soportados:

```txt
ACTIVE
SUSPENDED
INACTIVE
```

### Módulo de rutas

- Lista de rutas.
- Búsqueda por nombre, origen o destino.
- Filtro por estado.
- Formulario de creación.
- Cambio de estado de la ruta.
- Acciones basadas en rol.
- Estados de carga, error y datos vacíos.

Estados soportados:

```txt
ACTIVE
INACTIVE
```

### Módulo de viajes

- Lista de viajes.
- Búsqueda por vehículo, conductor, ruta o notas.
- Filtro por estado.
- Formulario de creación.
- Carga de vehículos disponibles.
- Carga de conductores activos.
- Carga de rutas activas.
- Cambio de estado del viaje.
- Visualización de errores de reglas de negocio del Back-End.
- Acciones basadas en rol.

Estados soportados:

```txt
SCHEDULED
IN_PROGRESS
COMPLETED
CANCELLED
```

Transiciones soportadas en la interfaz:

```txt
SCHEDULED   -> IN_PROGRESS
SCHEDULED   -> CANCELLED
IN_PROGRESS -> COMPLETED
IN_PROGRESS -> CANCELLED
```

### Soporte de tema claro y oscuro

La aplicación incluye soporte para tema claro y tema oscuro.

El tema seleccionado se guarda en `localStorage`, por lo que la preferencia del usuario se mantiene después de refrescar o volver a abrir la aplicación. El sistema de temas utiliza un servicio global, variables CSS y la integración de Bootstrap mediante `data-bs-theme`.

### Configuración y soporte de idioma

La sección de configuración está disponible para usuarios autenticados desde la zona inferior del sidebar.

Los usuarios pueden cambiar el idioma de la interfaz entre inglés y español. El idioma seleccionado se guarda en `localStorage` mediante un `LanguageService` global, y las etiquetas soportadas del layout, dashboard, administración, autenticación, estados compartidos, tablas, filtros y formularios se actualizan inmediatamente después de la selección.

---

## Reglas de negocio

El Front-End ayuda al usuario a seleccionar datos válidos, pero la API sigue siendo responsable de la validación final.

Reglas principales representadas en la UI y en la mock API:

- Solo usuarios autenticados pueden acceder a recursos protegidos.
- Solo vehículos disponibles pueden asignarse a viajes.
- Solo conductores activos pueden asignarse a viajes.
- Solo rutas activas pueden asignarse a viajes.
- Usuarios `VIEWER` solo pueden consultar información.
- Las acciones administrativas están restringidas por rol.
- El registro público no puede solicitar el rol `ADMIN`.
- Los registros públicos solo pueden solicitar `VIEWER`, `OPERATOR` o `SUPERVISOR`.
- Los códigos de verificación son simulados por la mock API solo para desarrollo.
- Las transiciones de estado de viajes dependen del estado actual.

---

## Rutas de la aplicación

| Ruta             | Descripción                       | Acceso                            |
| ---------------- | --------------------------------- | --------------------------------- |
| `/login`         | Pantalla de login                 | Pública                           |
| `/register`      | Pantalla de registro              | Pública                           |
| `/dashboard`     | Dashboard operativo               | Usuarios autenticados             |
| `/vehicles`      | Gestión de vehículos              | Usuarios autenticados             |
| `/vehicles/new`  | Crear vehículo                    | `ADMIN`                           |
| `/drivers`       | Gestión de conductores            | Usuarios autenticados             |
| `/drivers/new`   | Crear conductor                   | `ADMIN`                           |
| `/routes`        | Gestión de rutas                  | Usuarios autenticados             |
| `/routes/new`    | Crear ruta                        | `ADMIN`                           |
| `/trips`         | Gestión de viajes                 | Usuarios autenticados             |
| `/trips/new`     | Crear viaje                       | `ADMIN`, `OPERATOR`, `SUPERVISOR` |
| `/admin`         | Área demo solo admin              | `ADMIN`                           |
| `/settings`      | Configuración de usuario e idioma | Usuarios autenticados             |
| `/access-denied` | Pantalla de acceso no autorizado  | Usuarios autenticados             |

---

## Estructura del proyecto

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
│   │   ├── trips/
│   │   └── settings/
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

## Capa Core

La capa `core` contiene lógica global de la aplicación.

| Archivo                | Propósito                                          |
| ---------------------- | -------------------------------------------------- |
| `auth.guard.ts`        | Protege rutas privadas                             |
| `role.guard.ts`        | Restringe rutas por rol de usuario                 |
| `auth.interceptor.ts`  | Agrega el token a las peticiones HTTP              |
| `error.interceptor.ts` | Maneja respuestas no autorizadas o prohibidas      |
| `auth.service.ts`      | Maneja login, registro, logout y sesión de usuario |
| `theme.service.ts`     | Maneja tema claro/oscuro y persistencia            |
| `language.service.ts`  | Maneja persistencia de idioma inglés/español       |
| `vehicles.service.ts`  | Operaciones API de vehículos                       |
| `drivers.service.ts`   | Operaciones API de conductores                     |
| `routes.service.ts`    | Operaciones API de rutas                           |
| `trips.service.ts`     | Operaciones API de viajes                          |

La aplicación usa interfaces de TypeScript y union types para definir contratos de API y valores válidos de estado.

Ejemplo:

```ts
export type TripStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
```

---

## Capa Shared

Los elementos reutilizables de UI viven en la capa `shared`.

| Componente/Directiva      | Propósito                                   |
| ------------------------- | ------------------------------------------- |
| `PageHeaderComponent`     | Título estándar de página y botón de acción |
| `StatusBadgeComponent`    | Etiquetas visuales de estado                |
| `LoadingSpinnerComponent` | Estado de carga                             |
| `EmptyStateComponent`     | Estado sin datos                            |
| `HasRoleDirective`        | Muestra u oculta elementos por rol          |

---

## Integración con API

La aplicación espera una API en:

```txt
http://localhost:4000/api
```

Configurado en:

```txt
src/environments/environment.development.ts
```

Respuesta exitosa esperada:

```json
{
  "success": true,
  "message": "Trips retrieved successfully",
  "data": []
}
```

Respuesta de error esperada:

```json
{
  "success": false,
  "message": "Vehicle must be AVAILABLE to schedule a trip."
}
```

---

## Mock API local

Este repositorio incluye una pequeña mock API con Express en la carpeta `server/`. Permite ejecutar el Front-End de forma independiente para pruebas locales y demostraciones de portafolio.

Iniciar la mock API:

```bash
npm run api
```

Modo desarrollo con watch:

```bash
npm run api:dev
```

Health check:

```txt
GET http://localhost:4000/api/health
```

La mock API incluye datos de ejemplo, autenticación, registro público, validaciones de autorización, operaciones CRUD por entidad y reglas de negocio para viajes.

La verificación de registro se simula solo para desarrollo local y pruebas de portafolio:

```txt
Código de correo: 123456
Código de teléfono: 654321
```

La mock API rechaza correos duplicados, teléfonos duplicados, códigos de verificación inválidos, roles solicitados inválidos y cualquier solicitud pública de `ADMIN`.

---

## Endpoints principales

### Auth

```txt
POST /api/auth/login
POST /api/auth/request-email-code
POST /api/auth/request-phone-code
POST /api/auth/register
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

## Usuarios demo

| Rol          | Email                       | Password        |
| ------------ | --------------------------- | --------------- |
| `ADMIN`      | `admin@transitops.com`      | `admin123`      |
| `OPERATOR`   | `operator@transitops.com`   | `operator123`   |
| `SUPERVISOR` | `supervisor@transitops.com` | `supervisor123` |
| `VIEWER`     | `viewer@transitops.com`     | `viewer123`     |

---

## Instalación

Instalar dependencias:

```bash
npm install
```

Ejecutar la mock API en una terminal:

```bash
npm run api
```

Ejecutar la aplicación Angular en otra terminal:

```bash
npm start
```

Abrir la aplicación:

```txt
http://localhost:4200
```

---

## Scripts disponibles

| Comando            | Descripción                                |
| ------------------ | ------------------------------------------ |
| `npm start`        | Inicia Angular en el puerto 4200           |
| `npm run api`      | Inicia la mock API local en el puerto 4000 |
| `npm run api:dev`  | Inicia la mock API con watch mode          |
| `npm run build`    | Compila la aplicación Angular              |
| `npm test`         | Ejecuta pruebas Angular                    |
| `npm run test:api` | Ejecuta pruebas de la mock API             |

---

## Capturas recomendadas

Usa la carpeta `docs/screenshots/` para imágenes de portafolio.

Capturas sugeridas:

```txt
docs/screenshots/login.png
docs/screenshots/dashboard.png
docs/screenshots/vehicles.png
docs/screenshots/drivers.png
docs/screenshots/routes.png
docs/screenshots/trips.png
docs/screenshots/trip-form.png
docs/screenshots/access-denied.png
docs/screenshots/dark-theme.png
docs/screenshots/mobile-sidebar.png
```

---

## Puntos destacados de arquitectura

Este proyecto demuestra:

- Organización Angular basada en features.
- Componentes standalone.
- Modelos de API tipados.
- Componentes reutilizables de UI.
- Guards para autenticación y autorización.
- Interceptors HTTP para token y errores globales.
- Directiva estructural para renderizado basado en roles.
- Formularios reactivos con validación.
- Filtrado local de tablas.
- Transiciones de estado desde tablas administrativas.
- Layout responsive con sidebar móvil.
- Sistema de tema claro/oscuro con variables CSS.
- Preferencia de idioma inglés/español con persistencia local y cobertura ampliada de UI.
- Mock API local para pruebas independientes.

---

## Explicación para entrevista

Explicación breve:

> TransitOps Control Panel es un panel administrativo desarrollado con Angular para operaciones de transporte. Consume una API REST para gestionar vehículos, conductores, rutas y viajes. Implementé autenticación, rutas protegidas, acciones basadas en roles, componentes reutilizables, formularios reactivos, servicios HTTP tipados, filtros de tabla, transiciones de estado, tema claro/oscuro y layout responsive.

Explicación técnica:

> La aplicación usa Angular standalone components, Angular Router, HttpClient y RxJS. La comunicación por dominio está separada en servicios como VehiclesService, DriversService, RoutesService y TripsService. La autenticación se maneja mediante AuthService, con un token local adjuntado automáticamente por un interceptor HTTP. También implementé guards de autenticación y validación de roles, una directiva estructural reutilizable para ocultar elementos según el rol actual, un ThemeService para manejar tema claro/oscuro y un LanguageService para preferencias ampliadas de UI en inglés/español con persistencia local.

Explicación de negocio:

> El sistema ayuda a administradores de transporte a monitorear recursos operativos, gestionar disponibilidad de vehículos y conductores, configurar rutas y programar viajes. La interfaz evita selecciones inválidas cuando es posible, mientras que la API aplica las reglas de negocio finales, como impedir viajes con vehículos no disponibles, conductores suspendidos o rutas inactivas.

---

## Estado actual

Implementado:

- UI de autenticación.
- UI de registro con verificación simulada por correo y teléfono.
- Layout administrativo protegido.
- Sidebar y navbar responsive.
- Dashboard con métricas calculadas.
- Lista, creación y actualización de estado de vehículos.
- Lista, creación y actualización de estado de conductores.
- Lista, creación y actualización de estado de rutas.
- Lista, creación y actualización de estado de viajes.
- Creación de viajes con catálogos relacionados.
- Botones y control de acceso basado en roles.
- Búsqueda y filtros por estado.
- Estados de carga, error y datos vacíos.
- Tema claro y tema oscuro.
- Sección de configuración con selector de idioma inglés/español.
- Cobertura ampliada inglés/español para texto estático visible de la UI.
- Mock API local con pruebas.

Mejoras futuras posibles:

- Flujo de aprobación administrativa para roles solicitados en registros
- Formularios de edición.
- Páginas de detalle.
- Paginación server-side.
- Búsqueda y filtros server-side.
- Notificaciones tipo toast.
- Más pruebas unitarias.
- Pruebas E2E.
- Gráficas en dashboard.
- Configuración de despliegue.

---

## Autor

Carlos.

Proyecto: TransitOps Platform  
Capa: Front-End Control Panel  
Enfoque: sistema administrativo Angular, integración con API REST y operaciones basadas en roles
