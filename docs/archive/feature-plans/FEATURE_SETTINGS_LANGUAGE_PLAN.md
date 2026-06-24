# Feature Plan: Settings Page with Language Selector

## Goal

Add a Settings section accessible from the sidebar and implement a basic language selector for English and Spanish.

## Branch

`feature/settings-language`

## Scope

This feature should introduce:

- A new `/settings` route.
- A new Settings feature component.
- A Settings link in the sidebar, placed near the bottom area of the aside.
- A global language service.
- English and Spanish language support.
- Language persistence using `localStorage`.
- Immediate UI language updates after selection.
- Basic translations for layout and Settings page.
- README updates in English and Spanish.

## Out of Scope for This PR

Do not translate the entire application in this first PR.

Keep these for future PRs:

- Full translation of every table column.
- Full translation of every form validation message.
- Full translation of API error messages.
- External i18n libraries.
- Browser locale auto-detection.

## Architecture Guidelines

Keep the current architecture:

- `src/app/core/models` for the language type.
- `src/app/core/services` for the language service.
- `src/app/features/settings` for the Settings page.
- `src/app/layout/sidebar` for the sidebar navigation entry.

Suggested files:

```txt
src/app/core/models/language.model.ts
src/app/core/services/language.service.ts
src/app/features/settings/settings.component.ts
src/app/features/settings/settings.component.html
src/app/features/settings/settings.component.scss
```

Optional later if translations grow:

```txt
src/app/core/i18n/translations.ts
```

## Supported Languages

```ts
export type AppLanguage = 'en' | 'es';
```

## Suggested Translation Keys

Start with layout and settings only:

```txt
sidebar.dashboard
sidebar.vehicles
sidebar.drivers
sidebar.routes
sidebar.trips
sidebar.admin
sidebar.settings
sidebar.theme.light
sidebar.theme.dark
sidebar.meta.project
sidebar.meta.description
settings.title
settings.subtitle
settings.language.title
settings.language.description
settings.language.english
settings.language.spanish
settings.language.current
```

## Acceptance Criteria

- `/settings` loads for authenticated users.
- Sidebar displays a Settings link near the lower area of the aside.
- Users can switch between English and Spanish.
- Selected language persists after page refresh.
- Sidebar labels update when language changes.
- Settings page labels update when language changes.
- Existing dark theme behavior remains working.
- `npm run build` passes.
- Existing tests pass.
- README.md and README.es.md mention Settings and language support.

## Recommended PR Title

`feat: add settings page with language selector`

## Recommended Validation

```bash
npm run build
npm test -- --watch=false --progress=false
npm run test:api
```
