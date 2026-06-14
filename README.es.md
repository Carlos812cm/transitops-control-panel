# TransitOps Control Panel

[English](README.md) | Español

TransitOps Control Panel es una plataforma Full-Stack para operaciones de transporte construida con Angular, Express, Prisma y PostgreSQL.

El sistema permite gestionar usuarios, vehículos, conductores, rutas y viajes mediante una interfaz administrativa con autenticación, autorización por roles, API REST real y persistencia en base de datos relacional.

---

## Propósito del proyecto

El objetivo del proyecto es demostrar un sistema administrativo realista, no solo una interfaz visual. TransitOps integra Front-End, Back-End y base de datos para representar flujos comunes de una plataforma interna de operaciones.

El proyecto puede explicarse en entrevistas desde tres perspectivas:

- Como panel Front-End con Angular.
- Como API Back-End con reglas de negocio.
- Como sistema Full-Stack conectado a PostgreSQL.

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
- Estados de carga, error y datos vacíos.
- Filtros y búsqueda en tablas.
- Tema claro y oscuro.
- Idioma inglés y español.
- Mock API local como respaldo para pruebas del Front-End.

---

## Roles

| Rol | Acceso |
| --- | --- |
| ADMIN | Acceso administrativo completo |
| OPERATOR | Acceso operativo para viajes |
| SUPERVISOR | Acceso operativo para viajes |
| VIEWER | Acceso solo lectura |

---

## Reglas de negocio

La API es la fuente final de validación. Entre las reglas principales:

- Solo usuarios autenticados pueden acceder a recursos protegidos.
- Solo vehículos disponibles pueden asignarse a viajes.
- Solo conductores activos pueden asignarse a viajes.
- Solo rutas activas pueden asignarse a viajes.
- Los usuarios de solo lectura no pueden ejecutar acciones protegidas.
- Las acciones administrativas requieren rol autorizado.
- Los recursos con viajes relacionados están protegidos contra eliminación.

---

## Rutas principales de la aplicación

| Ruta | Descripción | Acceso |
| --- | --- | --- |
| /login | Login | Pública |
| /register | Registro | Pública |
| /dashboard | Dashboard operativo | Usuarios autenticados |
| /vehicles | Gestión de vehículos | Usuarios autenticados |
| /drivers | Gestión de conductores | Usuarios autenticados |
| /routes | Gestión de rutas | Usuarios autenticados |
| /trips | Gestión de viajes | Usuarios autenticados |
| /users | Gestión de usuarios | ADMIN |
| /settings | Configuración e idioma | Usuarios autenticados |
| /access-denied | Acceso no autorizado | Usuarios autenticados |

---

## API real

La aplicación Angular consume una API REST local en el puerto 4000. La API real se encuentra en la carpeta `server` y expone endpoints para:

- Dashboard
- Auth
- Users
- Vehicles
- Drivers
- Routes
- Trips

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
| npm start | Inicia Angular |
| npm run build | Compila Angular |
| npm run test:api | Ejecuta pruebas de la mock API |
| npm run api:real | Inicia la API real |
| npm run api:real:seed | Ejecuta seed de la base de datos |
| npm run api:real:typecheck | Valida TypeScript del Back-End |
| npm run api:real:test | Ejecuta pruebas del Back-End |
| npm run api:real:build | Compila el Back-End |

---

## Smoke test

La guía completa para validar el sistema local está en:

`docs/real-api-smoke-test.md`

Validación recomendada antes de una demo:

- Build de Angular.
- Pruebas de mock API.
- Typecheck del Back-End.
- Pruebas del Back-End.
- Build del Back-End.

---

## Flujo de demo

Orden sugerido para presentar el proyecto:

1. Login.
2. Dashboard.
3. Vehicles.
4. Drivers.
5. Routes.
6. Trips.
7. Users.
8. Settings.
9. Arquitectura del código.

Explicación breve:

TransitOps Platform es un sistema administrativo Full-Stack para operaciones de transporte. Usa Angular para el panel de control, Express para la API, Prisma para el acceso a datos y PostgreSQL para la persistencia. El sistema gestiona usuarios, vehículos, conductores, rutas y viajes con autenticación, roles y reglas de negocio.

---

## Checklist para entrevista

Antes de presentar:

- PostgreSQL está corriendo.
- La base de datos tiene datos de prueba.
- La API real está activa.
- Angular está activo.
- El login funciona.
- El Dashboard carga datos reales.
- Vehicles, Drivers, Routes y Trips cargan registros.
- Trips muestra relaciones entre vehículo, conductor y ruta.
- README y smoke test están actualizados.

---

## Arquitectura destacada

Este proyecto demuestra:

- Organización Angular basada en features.
- Componentes standalone.
- Servicios tipados por dominio.
- Guards de autenticación y autorización.
- Interceptors HTTP.
- Formularios reactivos.
- API REST real con Express y Prisma.
- Modelo relacional con PostgreSQL.
- Validación con Zod.
- Autorización por roles en Back-End.
- Pruebas de rutas con Vitest.

---

## Estado actual

Implementado:

- Panel Angular.
- API real con Express.
- Base de datos PostgreSQL con Prisma.
- Dashboard real.
- Endpoints reales para usuarios, vehículos, conductores, rutas y viajes.
- Reglas de negocio para viajes.
- Mock API como respaldo.
- Guía de smoke test.
- Flujo de demo y checklist para entrevista.

Mejoras futuras posibles:

- Formularios de edición.
- Páginas de detalle.
- Paginación del lado del servidor.
- Notificaciones tipo toast.
- Pruebas E2E.
- Gráficas en Dashboard.
- Configuración de despliegue.

---

## Autor

Carlos.

Proyecto: TransitOps Platform  
Capa: Full-Stack Control Panel  
Enfoque: sistema administrativo Angular, integración REST, PostgreSQL y operaciones basadas en roles
