# Feature Plan: Auth Registration Flow

## Goal

Add a realistic user registration flow to the authentication module.

This feature introduces a public registration page, simulated email/phone verification codes through the mock API, required registration validations, requested role selection and a success state that redirects users back to login.

## Branch

`feature/auth-registration-flow`

## Context

The project already includes:

- Login flow.
- Role-based UI.
- AuthGuard and RoleGuard.
- Mock API.
- Dark theme.
- English/Spanish i18n coverage.
- Demo users.

Current supported roles:

- `ADMIN`
- `OPERATOR`
- `SUPERVISOR`
- `VIEWER`

## Product Rule

Public registration must not allow users to self-register as `ADMIN`.

A user can request one of these roles:

- `VIEWER`
- `OPERATOR`
- `SUPERVISOR`

For this first PR, the requested role can be stored as part of the new user. If full approval status is not already supported by the current mock user model, document admin approval as a future enhancement.

## Scope

This PR should add:

- `/register` route.
- Register page under `src/app/features/auth/register`.
- Link from login to register.
- Link from register to login.
- Reactive registration form.
- Required field validations.
- Password confirmation validation.
- Simulated email code request.
- Simulated phone code request.
- Mock API registration endpoint.
- Success confirmation after registration.
- English and Spanish translations.
- README.md and README.es.md updates.

## Required Register Fields

All fields are required:

- First name
- Last name
- Phone
- Phone verification code
- Email
- Email verification code
- Password
- Confirm password
- Requested role

## Suggested UI Sections

The register page should be visually organized as:

1. Personal information
2. Account access
3. Verification
4. Requested role
5. Success confirmation

## Front-End Requirements

- Use Reactive Forms.
- Disable final registration until the form is valid.
- Show validation feedback for required/invalid fields.
- Validate email format.
- Validate phone format.
- Validate password minimum length.
- Validate password and confirm password match.
- Keep the UI compatible with light and dark themes.
- Use the existing `LanguageService` for English/Spanish text.
- Do not break the existing login flow.
- Do not break existing guards/interceptors.
- Do not add external UI/i18n libraries.

## Mock API Requirements

Add or extend mock API endpoints:

```txt
POST /api/auth/request-email-code
POST /api/auth/request-phone-code
POST /api/auth/register
```

Behavior:

- Generate or simulate email code for development.
- Generate or simulate phone code for development.
- Reject duplicate email.
- Reject duplicate phone.
- Reject invalid email verification code.
- Reject invalid phone verification code.
- Reject invalid requested role.
- Reject `ADMIN` role from public registration.
- Create user only after both codes are valid.

Development codes may be fixed for portfolio/testing purposes, for example:

```txt
Email code: 123456
Phone code: 654321
```

Document that this is mock/development verification only.

## Suggested Models

Extend auth/user models only as needed.

Possible request model:

```ts
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  requestedRole: 'VIEWER' | 'OPERATOR' | 'SUPERVISOR';
  emailCode: string;
  phoneCode: string;
}
```

Possible response model:

```ts
export interface RegisterResponseData {
  id: string;
  email: string;
  phone: string;
  requestedRole: 'VIEWER' | 'OPERATOR' | 'SUPERVISOR';
}
```

## Out of Scope

Do not include these in this PR:

- Real email sending service.
- Real SMS provider.
- Admin user management page.
- User approval workflow UI.
- Profile page.
- Password reset flow.
- Refresh token architecture.
- Back-End production implementation.

## Future Enhancements

Recommended future PRs:

- `feature/users-management`: Admin page to approve/reject users and requested roles.
- `feature/user-profile`: User profile page.
- `feature/password-reset`: Forgot password flow.
- `feature/auth-i18n-error-normalization`: Translate API auth messages consistently.

## Acceptance Criteria

- `/register` loads publicly.
- Login page links to register.
- Register page links back to login.
- All fields are required.
- Invalid email is blocked.
- Invalid phone is blocked.
- Password mismatch is blocked.
- ADMIN cannot be selected or submitted.
- Email verification code can be requested.
- Phone verification code can be requested.
- Invalid codes are rejected.
- Valid codes allow successful registration.
- Success state shows confirmation and button to login.
- Existing login still works.
- English/Spanish UI still works.
- Dark theme still works.
- `npm run build` passes.
- Existing tests pass.
- Mock API tests pass.

## Recommended PR Title

`feat: add auth registration flow`

## Recommended Validation

```bash
npm run build
npm test -- --watch=false --progress=false
npm run test:api
```
