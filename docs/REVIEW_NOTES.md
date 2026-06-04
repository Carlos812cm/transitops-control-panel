# TransitOps Control Panel - Review Notes

This version was cleaned and validated before GitHub publication.

## Corrections Applied

- Replaced the default Angular README with a professional portfolio README.
- Added `docs/screenshots/.gitkeep` as a placeholder for future screenshots.
- Renamed Angular files to clearer conventions:
  - `auth.ts` -> `auth.service.ts`
  - `auth-guard.ts` -> `auth.guard.ts`
  - `role-guard.ts` -> `role.guard.ts`
  - `auth-interceptor.ts` -> `auth.interceptor.ts`
  - `error-interceptor.ts` -> `error.interceptor.ts`
  - `has-role.ts` -> `has-role.directive.ts`
  - `auth-layout,component.html` -> `auth-layout.component.html`
- Updated all affected imports and template references.
- Updated the production environment API URL to the local portfolio API endpoint.
- Replaced old Sass `@import` Bootstrap loading with a modern `@use` entry.
- Removed generated build/cache folders from the distributable project.
- Formatted project files with Prettier.

## Validation Results

Executed successfully:

```bash
npm ci
npm run build -- --progress=false
npm run test:api
npm test -- --watch=false --progress=false
```

Results:

- Angular production build: passed
- Mock API tests: 4 passed
- Angular tests: 2 passed

## Remaining Note

The Angular build currently emits a bundle budget warning because the initial browser bundle is slightly above the default 500 KB warning budget. This is not a build failure and does not block GitHub publication. It can be addressed later by tuning budgets or optimizing Bootstrap/CSS loading.
