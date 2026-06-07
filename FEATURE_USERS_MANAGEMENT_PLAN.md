# Feature Plan: Users Management and Approval Workflow

## Goal

Add a realistic user management workflow for administrators.

This feature should extend the registration flow by introducing user approval states and an admin-only Users Management section where pending users can be reviewed, approved, rejected, activated, suspended or deactivated.

## Branch

`feature/users-management`

## Context

The project already includes:

- Login flow.
- Public registration flow.
- Simulated email/phone verification codes.
- Requested role selection during registration.
- Role-based UI.
- AuthGuard and RoleGuard.
- Mock API.
- Dark theme.
- English/Spanish i18n coverage.

Current roles:

- `ADMIN`
- `OPERATOR`
- `SUPERVISOR`
- `VIEWER`

## Product Rule

Public registration must not directly grant elevated access.

Recommended rule:

- `VIEWER` registrations may become `ACTIVE` immediately.
- `OPERATOR` and `SUPERVISOR` registrations should become `PENDING_APPROVAL`.
- `ADMIN` cannot be requested through public registration.
- Only `ADMIN` users can approve, reject, activate, suspend or deactivate users.

## User Status Model

Extend the user status model to support:

```ts
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'SUSPENDED';
```

Recommended user fields:

```ts
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  requestedRole?: PublicRegistrationRole;
  status: UserStatus;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
```

## Registration Behavior Update

Update registration behavior:

- If requestedRole is `VIEWER`:
  - role: `VIEWER`
  - requestedRole: `VIEWER`
  - status: `ACTIVE`
- If requestedRole is `OPERATOR` or `SUPERVISOR`:
  - role: `VIEWER` or no elevated role until approved. Prefer `VIEWER` for compatibility.
  - requestedRole: requested role
  - status: `PENDING_APPROVAL`

Login behavior:

- `ACTIVE` users can sign in.
- `PENDING_APPROVAL`, `REJECTED`, `SUSPENDED`, and `INACTIVE` users should not be allowed to sign in.
- Return a clear API message when login is blocked by status.

## New Admin Section

Add an admin-only route:

```txt
/users
```

Access:

```txt
ADMIN only
```

Recommended location:

```txt
src/app/features/users/users-list/
```

## Users Management UI

The Users page should include:

- Page title and subtitle.
- Summary cards or counters:
  - Total users
  - Active users
  - Pending approval
  - Rejected/Suspended users
- Filters:
  - Search by name/email/phone
  - Status filter
  - Role filter
- Users table with:
  - Name
  - Email
  - Phone
  - Current role
  - Requested role
  - Status
  - Created date
  - Actions

## User Actions

For `ADMIN` only:

- Approve pending user.
- Reject pending user.
- Suspend active user.
- Reactivate suspended/inactive user.
- Deactivate user.

Recommended business rules:

- Approving a pending user sets:
  - role = requestedRole
  - status = ACTIVE
- Rejecting a pending user sets:
  - status = REJECTED
- Suspending a user sets:
  - status = SUSPENDED
- Reactivating a user sets:
  - status = ACTIVE
- Deactivating a user sets:
  - status = INACTIVE
- Do not allow self-deactivation or self-suspension for the currently authenticated admin.
- Do not allow changing another ADMIN's status in this PR unless explicitly implemented safely.

## Mock API Endpoints

Add or update these endpoints:

```txt
GET   /api/users
GET   /api/users/:id
PATCH /api/users/:id/approve
PATCH /api/users/:id/reject
PATCH /api/users/:id/status
```

Access:

- All `/api/users` endpoints require authentication.
- All `/api/users` endpoints require `ADMIN`.

Suggested query params for `GET /api/users`:

```txt
status
role
q
```

## Front-End Service

Add:

```txt
src/app/core/services/users.service.ts
```

Methods:

```ts
getUsers(params?)
getUserById(id)
approveUser(id)
rejectUser(id)
updateUserStatus(id, status)
```

## i18n Requirements

Add English and Spanish translations for:

- Sidebar Users item.
- Users page title/subtitle.
- Summary cards.
- Filters.
- Table headers.
- Empty/loading/error states.
- Actions.
- User status labels.
- Confirmation/success/error messages.

## Sidebar

Add Users link to sidebar for `ADMIN` only.

Recommended route:

```txt
/users
```

## Out of Scope

Do not include these in this PR:

- Real email/SMS providers.
- Real database persistence.
- Password reset.
- User profile editing.
- Audit logs.
- Multi-factor authentication.
- Full production-grade RBAC.
- Backend production implementation.

## Acceptance Criteria

- `/users` is accessible only to ADMIN.
- Non-admin users cannot access `/users`.
- Registered OPERATOR/SUPERVISOR users appear as `PENDING_APPROVAL`.
- ADMIN can approve pending users.
- Approved users become `ACTIVE` with their requested role.
- ADMIN can reject pending users.
- Rejected users cannot log in.
- Pending users cannot log in.
- Suspended/inactive users cannot log in.
- ADMIN can filter and search users.
- Users table displays current role, requested role and status.
- Sidebar displays Users only for ADMIN.
- Existing login still works.
- Existing registration still works.
- Existing role guards still work.
- English/Spanish UI still works.
- Dark theme still works.
- `npm run build` passes.
- Existing tests pass.
- Mock API tests pass.

## Recommended PR Title

`feat: add users management workflow`

## Recommended Validation

```bash
npm run build
npm test -- --watch=false --progress=false
npm run test:api
```

## Recommended Manual Tests

- Register a VIEWER user and confirm login works.
- Register an OPERATOR user and confirm login is blocked while pending.
- Login as ADMIN.
- Open `/users`.
- Approve the pending OPERATOR user.
- Login as the approved OPERATOR user.
- Register a SUPERVISOR user and reject it.
- Confirm rejected user cannot login.
- Test Spanish language.
- Test dark theme.
