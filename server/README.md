@'
# TransitOps API Workspace

This folder contains the Back-End workspace for TransitOps Platform.

## Current structure

```txt
server/
├── mock/      # Existing local mock API used by the Angular Front-End
├── src/       # Real Back-End API workspace
├── prisma/    # Prisma schema and migrations
└── tests/     # Back-End tests

Purpose

The existing mock API is preserved temporarily to keep the Front-End stable while the real API is built.

The real API will be implemented with:

Node.js
Express
TypeScript
Prisma ORM
PostgreSQL
JWT authentication
bcrypt password hashing
Zod validation
Role-based authorization
Vitest and Supertest
Compatibility rule

The real API must preserve the current Front-End contracts initially:

unitNumber for vehicles
ADMIN, OPERATOR, SUPERVISOR, VIEWER roles
ACTIVE, INACTIVE, PENDING_APPROVAL, REJECTED, SUSPENDED user statuses
Standard { success, message, data } API responses
Existing /api/... endpoint paths
'@ | Set-Content server\README.md


---

# Fase 1K — Validar cambios

Ejecuta:

```powershell
git status