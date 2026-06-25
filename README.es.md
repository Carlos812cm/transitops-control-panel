# TransitOps Control Panel

[English](README.md) | Español

TransitOps Control Panel es una plataforma Full-Stack para operaciones de transporte construida con Angular, Express, Prisma y PostgreSQL.

El sistema permite gestionar usuarios, vehículos, conductores, rutas y viajes mediante una interfaz administrativa con autenticación, autorización por roles, API REST real y persistencia en base de datos relacional.

Versión estable actual: `v1.8.0`

---

## Demo pública

| Recurso | URL |
| --- | --- |
| Demo pública Front-End | https://transitops-control-panel.onrender.com |
| Health check público del API | https://transitops-api.onrender.com/api/health |
| API base pública | https://transitops-api.onrender.com/api |

Credenciales demo:

| Rol | Email | Password | Uso |
| --- | --- | --- | --- |
| `ADMIN` | `admin@transitops.com` | `admin123` | Acceso completo para demo |
| `OPERATOR` | `operator@transitops.com` | `operator123` | Flujo operativo de viajes |
| `SUPERVISOR` | `supervisor@transitops.com` | `supervisor123` | Flujo operativo de viajes |
| `VIEWER` | `viewer@transitops.com` | `viewer123` | Validación de solo lectura |

> Estas credenciales son únicamente para una base de datos demo controlada. No deben reutilizarse en sistemas reales.

---

## Propósito del proyecto

El objetivo del proyecto es demostrar un sistema administrativo realista, no solo una interfaz visual. TransitOps integra Front-End, Back-End y base de datos para representar flujos comunes de una plataforma interna de operaciones.

El proyecto puede explicarse en entrevistas desde tres perspectivas:

- Como panel Front-End con Angular.
- Como API Back-End con reglas de negocio.
- Como sistema Full-Stack conectado a PostgreSQL y desplegado públicamente.

---

## Revisión de portafolio

Usa estos documentos para validar y presentar el proyecto:

| Documento | Propósito |
| --- | --- |
| [`docs/final-qa-and-demo-checklist.md`](docs/final-qa-and-demo-checklist.md) | QA final, revisión responsive, revisión de tema y flujo de demo para entrevista |
| [`docs/real-api-smoke-test.md`](docs/real-api-smoke-test.md) | Validación local completa de PostgreSQL, API y Angular |
| [`docs/releases/v1.8.0-demo-deployment.md`](docs/releases/v1.8.0-demo-deployment.md) | Notas del despliegue demo público |
| [`README.md`](README.md) | Versión en inglés para revisión técnica y portafolio internacional |

Flujo recomendado de portafolio:

```txt
1. Abrir la demo pública del Front-End.
2. Iniciar sesión con la cuenta ADMIN demo.
3. Mostrar métricas del Dashboard y módulos operativos.
4. Validar comportamiento por rol con la cuenta VIEWER.
5. Explicar la arquitectura de API, base de datos y despliegue.
6. Abrir el repositorio y recorrer la estructura del código.
```

---

## Stack tecnológico

| Tecnología | Propósito |
| --- | --- |
| Angular 21 | Panel administrativo Front-End |
| TypeScript | Tipado de lógica y contratos |
| Bootstrap 5 | Layout y componentes visuales |
| SCSS | Estilos personalizados |
| Angular Router | Rutas protegidas y navegación |
| Angular HttpClient | Comunicación con API REST |
| Reactive Forms | Formularios y validaciones |
| RxJS | Manejo de datos asíncronos |
| Express | API REST real y mock API local |
| Prisma | ORM para base de datos |
| PostgreSQL | Persistencia relacional |
| Supabase PostgreSQL | Base de datos demo pública |
| Render | Hosting demo público |
| Docker | Contenedor local de base de datos |
| Zod | Validación de requests en Back-End |
| Vitest | Pruebas de API |

---

## Funcionalidades principales

- Login y manejo de sesión.
- Rutas protegidas.
- UI basada en roles.
- Dashboard con métricas operativas reales.
- Gestión de usuarios.
- Gestión de vehículos.
- Gestión de conductores.
- Gestión de rutas.
- Gestión de viajes.
- Reglas de negocio en Back-End.
- Filtros y búsqueda en tablas.
- Metadata de paginación desde la API.
- Controles de paginación en el Front-End para listas operativas.
- Estados de carga, error y datos vacíos.
- Tema claro y oscuro.
- Idioma inglés y español.
- Despliegue demo público conectado a base de datos real.
- Mock API local como respaldo para pruebas del Front-End.

---

## Roles

| Rol | Acceso |
| --- | --- |
| `ADMIN` | Acceso administrativo completo |
| `OPERATOR` | Acceso operativo para viajes |
| `SUPERVISOR` | Acceso operativo para viajes |
| `VIEWER` | Acceso solo lectura |

---

## Reglas de negocio

La API es la fuente final de validación. Entre las reglas principales:

- Solo usuarios autenticados pueden acceder a recursos protegidos.
- Solo vehículos disponibles pueden asignarse a viajes.
- Solo conductores activos pueden asignarse a viajes.
- Solo rutas activas pueden asignarse a viajes.
- Los usuarios de solo lectura no pueden ejecutar acciones protegidas.
- Las acciones administrativas requieren rol autorizado.
- Los usuarios inactivos no pueden iniciar sesión.
- Solo administradores pueden gestionar usuarios.
- Los recursos con viajes relacionados están protegidos contra eliminación.

---

## Rutas principales de la aplicación

| Ruta | Descripción | Acceso |
| --- | --- | --- |
| `/login` | Login | Pública |
| `/register` | Registro | Pública |
| `/dashboard` | Dashboard operativo | Usuarios autenticados |
| `/vehicles` | Gestión de vehículos | Usuarios autenticados |
| `/vehicles/new` | Crear vehículo | `ADMIN` |
| `/drivers` | Gestión de conductores | Usuarios autenticados |
| `/drivers/new` | Crear conductor | `ADMIN` |
| `/routes` | Gestión de rutas | Usuarios autenticados |
| `/routes/new` | Crear ruta | `ADMIN` |
| `/trips` | Gestión de viajes | Usuarios autenticados |
| `/trips/new` | Crear viaje | `ADMIN`, `OPERATOR`, `SUPERVISOR` |
| `/users` | Gestión de usuarios | `ADMIN` |
| `/settings` | Configuración e idioma | Usuarios autenticados |
| `/access-denied` | Acceso no autorizado | Usuarios autenticados |

---

## URLs base del API

API pública demo:

```txt
https://transitops-api.onrender.com/api
```

API local de desarrollo:

```txt
http://localhost:4000/api
```

Configuradas en:

```txt
src/environments/environment.ts
src/environments/environment.development.ts
```

---

## API real

La aplicación Angular consume una API REST real que expone endpoints para:

- Health
- Dashboard
- Auth
- Users
- Vehicles
- Drivers
- Routes
- Trips

Los endpoints de listas soportan paginación y filtros con query params como:

```txt
?page=1&limit=10&search=term&status=ACTIVE
```

El endpoint de Dashboard resume métricas reales desde la base de datos y devuelve los últimos viajes con sus relaciones principales.

---

## Ejecución local

Flujo recomendado:

1. Instalar dependencias de la raíz.
2. Instalar dependencias dentro de `server`.
3. Iniciar PostgreSQL con Docker.
4. Ejecutar el seed de la base de datos.
5. Iniciar la API real.
6. Iniciar Angular.
7. Abrir la aplicación en el navegador.

Scripts útiles:

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia Angular |
| `npm run build` | Compila Angular |
| `npm run test:api` | Ejecuta pruebas de la mock API |
| `npm run api:real` | Inicia la API real |
| `npm run api:real:seed` | Ejecuta seed de la base de datos |
| `npm run api:real:typecheck` | Valida TypeScript del Back-End |
| `npm run api:real:test` | Ejecuta pruebas del Back-End |
| `npm run api:real:build` | Compila el Back-End |
| `npm run deploy:web:build` | Compila Angular para despliegue |
| `npm run deploy:api:build` | Compila el API para despliegue |

---

## Despliegue demo

La demo pública usa:

| Capa | Proveedor | Notas |
| --- | --- | --- |
| Base de datos | Supabase PostgreSQL | Base demo dedicada con migraciones Prisma y seed controlado |
| Back-End | Render Web Service | API Express desplegada desde `server` |
| Front-End | Render Web Service | Build Angular SSR/híbrido desplegado desde la raíz del repositorio |

Reglas de seguridad del despliegue:

- Los secretos se configuran solo en Render y Supabase.
- `DATABASE_URL` y `JWT_SECRET` no se versionan en el repositorio.
- El seed demo solo debe ejecutarse contra una base de datos dedicada.
- CORS debe permitir la URL pública del Front-End mediante `CLIENT_URL` en el servicio del API.

---

## Smoke test

La guía completa para validar el sistema local está en:

```txt
docs/real-api-smoke-test.md
```

Validación local recomendada antes de una demo:

- Build de Angular.
- Pruebas de mock API.
- Typecheck del Back-End.
- Pruebas del Back-End.
- Build del Back-End.

Validación pública recomendada:

```txt
1. Abrir https://transitops-api.onrender.com/api/health.
2. Iniciar sesión desde la demo pública del Front-End.
3. Validar Dashboard, Vehicles, Drivers, Routes y Trips.
4. Validar comportamiento de solo lectura con VIEWER.
5. Refrescar una ruta protegida como /dashboard.
```

---

## Checklist final de QA y demo

Antes de usar el proyecto en portafolio, revisión con reclutadores o entrevista técnica, valida la experiencia completa con:

```txt
docs/final-qa-and-demo-checklist.md
```

Esta guía cubre:

- Configuración del entorno local.
- Comandos de quality gate.
- Rutas para smoke test visual.
- Validación funcional por módulo.
- Revisión responsive.
- Revisión de tema claro y oscuro.
- Flujo recomendado de demo en vivo.
- Explicación breve para entrevista.

---

## Flujo de demo

Orden sugerido para presentar el proyecto:

```txt
1. Abrir la URL pública de la demo.
2. Iniciar sesión con la cuenta ADMIN demo.
3. Mostrar métricas del Dashboard.
4. Mostrar Vehicles, Drivers, Routes y Trips.
5. Demostrar reglas de negocio de viajes.
6. Mostrar gestión de usuarios.
7. Iniciar sesión con VIEWER y validar comportamiento de solo lectura.
8. Explicar API, schema Prisma y arquitectura de despliegue.
9. Recorrer la arquitectura del código.
```

Explicación breve:

> TransitOps Platform es un sistema administrativo Full-Stack para operaciones de transporte. Usa Angular para el panel de control, Express para la API, Prisma para el acceso a datos y PostgreSQL para la persistencia. La demo pública está desplegada con Render y Supabase, y permite gestionar usuarios, vehículos, conductores, rutas y viajes con autenticación, roles, listas paginadas y reglas de negocio aplicadas desde la API.

Puntos clave para mostrar:

- El Dashboard carga métricas desde la API real.
- Vehicles, Drivers, Routes y Trips consumen respuestas paginadas.
- Trips conecta vehículos, conductores y rutas.
- La API rechaza viajes con recursos no disponibles.
- Los usuarios VIEWER pueden consultar, pero no ejecutar acciones protegidas.
- Los usuarios ADMIN pueden gestionar recursos operativos y usuarios.

---

## Checklist para entrevista

Antes de presentar:

```txt
[ ] Demo pública del Front-End disponible
[ ] Health endpoint público del API responde correctamente
[ ] Login con ADMIN funciona
[ ] Dashboard carga datos reales
[ ] Vehicles, Drivers, Routes y Trips cargan registros
[ ] Las listas operativas muestran controles de paginación
[ ] Trips muestra relaciones entre vehículo, conductor y ruta
[ ] Comportamiento de solo lectura con VIEWER validado
[ ] Refresh de rutas protegidas funciona
[ ] Final QA and Demo Checklist completado
[ ] README y release notes actualizados
```

---

## Arquitectura destacada

Este proyecto demuestra:

- Organización Angular basada en features.
- Componentes standalone.
- Servicios tipados por dominio.
- Guards de autenticación y autorización.
- Interceptors HTTP.
- Formularios reactivos.
- Componentes UI reutilizables para comportamientos compartidos como paginación.
- API REST real con Express y Prisma.
- Modelo relacional con PostgreSQL.
- Validación con Zod.
- Autorización por roles en Back-End.
- Contratos de API paginados con metadata de respuesta.
- Pruebas de rutas con Vitest.
- Despliegue demo público con Render y Supabase.

---

## Estado actual

Implementado:

- Panel Angular.
- API real con Express.
- Base de datos PostgreSQL con Prisma.
- Base de datos demo pública en Supabase PostgreSQL.
- API pública desplegada en Render.
- Front-End Angular público desplegado en Render.
- Dashboard real.
- Endpoints reales para usuarios, vehículos, conductores, rutas y viajes.
- Reglas de negocio para viajes.
- Metadata de paginación en API.
- Paginación visual en Front-End para listas operativas.
- Mock API como respaldo.
- Guía de smoke test.
- Checklist final de QA y demo.
- Flujo de demo y checklist para entrevista.

Mejoras futuras posibles:

- Formularios de edición.
- Páginas de detalle.
- Notificaciones tipo toast.
- Pruebas E2E.
- Gráficas en Dashboard.
- Observabilidad y endurecimiento de CI/CD.

---

## Autor

Carlos.

Proyecto: TransitOps Platform  
Capa: Full-Stack Control Panel  
Enfoque: sistema administrativo Angular, integración REST, PostgreSQL y operaciones basadas en roles