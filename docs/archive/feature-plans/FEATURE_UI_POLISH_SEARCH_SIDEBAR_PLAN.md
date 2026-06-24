# Feature Plan: UI Polish, Sidebar Layout and Search Consistency

## Goal

Polish key UX details across the TransitOps Control Panel after the authentication and users management workflows.

This feature should focus on refinement, consistency and usability. It should not rewrite the application architecture or change core business rules.

## Branch

`feature/ui-polish-search-sidebar`

## Scope

This PR should address three focused areas:

1. Login demo users panel.
2. Sidebar layout overflow after adding Users navigation.
3. Search/filter behavior across all list sections.

## Current Context

The project already includes:

- Angular 21 administrative dashboard.
- Login and register flow.
- Role-based routes.
- Users management workflow.
- Mock API.
- English/Spanish i18n.
- Dark theme.
- CRUD/list sections for vehicles, drivers, routes, trips and users.

## 1. Login Demo Users Panel

### Problem

The login panel displays demo credentials, but the Operator user email is missing.

### Expected Behavior

The login demo users section should display all available demo accounts:

```txt
admin@transitops.com
operator@transitops.com
supervisor@transitops.com
viewer@transitops.com
```

### Requirements

- Add `operator@transitops.com` to the demo users list.
- Keep the visual style consistent.
- Add/adjust translations only if the demo users label or helper text requires it.
- Do not change login logic.

## 2. Sidebar Layout Polish

### Problem

After adding the Users section, the sidebar can be visually cut off at the bottom, especially when logged in as ADMIN because ADMIN has more menu items.

### Expected Behavior

The sidebar should remain usable at all viewport heights.

### Requirements

- Ensure the sidebar uses a robust vertical layout.
- The sidebar should support vertical scrolling when content exceeds viewport height.
- The top brand area, nav area and footer area should not overlap.
- The Settings link and theme toggle should remain reachable.
- The sidebar should work correctly for ADMIN and non-admin users.
- Preserve existing responsive behavior.
- Preserve dark theme styling.

### Suggested CSS Direction

Use a layout similar to:

```scss
.sidebar {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-nav {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
}

.sidebar-footer {
  flex: 0 0 auto;
}
```

Adjust exact selectors based on existing styles.

## 3. Search and Clear Behavior Consistency

### Problem

Search/filter inputs across list sections do not behave consistently.

Observed issues:

- Results do not always update while typing.
- Sometimes results update only after clicking outside the input.
- Clearing the search text does not always restore all records.
- Clicking the Clear button does not always fully reset the list.

### Target Sections

Review and fix search behavior in all list sections that have search/filter tools, including at minimum:

- Vehicles list.
- Drivers list.
- Routes list.
- Trips list.
- Users list.

If other sections include search/filter UI, include them too.

### Expected Behavior

For every searchable list:

- Search updates immediately as the user types.
- Empty search text restores all records.
- Clear button resets:
  - search input
  - status filter
  - role/type filters if present
  - displayed records
- Search should be case-insensitive.
- Search should trim leading/trailing spaces.
- Search should be resilient to undefined/null fields.
- Search should work without needing blur/click outside the input.

### Implementation Guidance

Prefer a consistent pattern across all list components.

Either:

1. Use `[(ngModel)]` with `(ngModelChange)="applyFilters()"`, or
2. Use Reactive Forms / FormControl with `valueChanges` and optional debounce.

Do not mix patterns unnecessarily unless the existing component structure requires it.

### Recommended Helper Logic

For local filtering:

```ts
private normalizeSearch(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}
```

For clear behavior:

```ts
clearFilters(): void {
  this.searchTerm = '';
  this.statusFilter = '';
  // reset any additional filters
  this.applyFilters();
}
```

For input deletion:

```ts
applyFilters(): void {
  const search = this.searchTerm.trim().toLowerCase();

  this.items = this.allItems.filter((item) => {
    const matchesSearch =
      !search ||
      // fields...

    return matchesSearch && otherFilters;
  });
}
```

### Server-Side vs Client-Side Filtering

If a component currently calls the API with query params, ensure the UI still behaves immediately and predictably.

Acceptable approaches:

- Local filtering after loading all records.
- API filtering triggered on every input change with a small debounce.

Prefer consistency and simplicity for this portfolio project.

## Out of Scope

Do not include in this PR:

- New business entities.
- New authentication rules.
- Database persistence.
- Modal redesigns.
- Major layout redesign.
- Rewriting all list components from scratch.
- Adding external UI libraries.

## Acceptance Criteria

- Login demo panel includes `operator@transitops.com`.
- Sidebar no longer cuts off content for ADMIN users.
- Sidebar footer remains reachable.
- Sidebar behaves correctly in dark theme.
- Search updates while typing in every list section.
- Deleting search text restores all records.
- Clear button restores all records and resets filters.
- Search is case-insensitive.
- Search works for common fields in each section.
- Existing auth, users management, role guards and API behavior remain intact.
- Existing tests still pass.
- Build passes.

## Validation

Run:

```bash
npm run build
npm test -- --watch=false --progress=false
npm run test:api
```

## Manual Test Checklist

### Login

- Open `/login`.
- Confirm demo users show:
  - admin@transitops.com
  - operator@transitops.com
  - supervisor@transitops.com
  - viewer@transitops.com

### Sidebar

- Login as ADMIN.
- Confirm sidebar shows Dashboard, Vehicles, Drivers, Routes, Trips, Admin, Users, Settings and theme toggle.
- Confirm bottom content is not cut off.
- Resize browser height smaller and confirm sidebar can still scroll/reach footer.
- Test dark theme.

### Search

For each list section:

- Vehicles
- Drivers
- Routes
- Trips
- Users

Test:

- Type a partial value and confirm results update immediately.
- Type uppercase/lowercase and confirm matching is case-insensitive.
- Delete all search text and confirm full list returns.
- Use Clear button and confirm full list returns.
- Combine search + filter, then clear and confirm all filters reset.

## Recommended PR Title

`fix: polish sidebar and search behavior`

## Recommended PR Description

```md
## Summary

Polishes UX details after the users management workflow.

## Changes

- Added missing Operator demo email to the login panel.
- Improved sidebar layout to prevent bottom content from being cut off.
- Improved search/filter behavior across list sections.
- Ensured clear buttons reset filters and restore full lists.
- Preserved existing auth, roles, i18n and dark theme behavior.

## Validation

- [ ] npm run build
- [ ] npm test -- --watch=false --progress=false
- [ ] npm run test:api
- [ ] Manual test: login demo users list
- [ ] Manual test: admin sidebar overflow
- [ ] Manual test: vehicles search and clear
- [ ] Manual test: drivers search and clear
- [ ] Manual test: routes search and clear
- [ ] Manual test: trips search and clear
- [ ] Manual test: users search and clear
- [ ] Manual test: dark theme
```
