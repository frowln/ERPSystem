# Findings Delta (old audit -> revalidated state)

## Resolved or obsolete from previous set

- `F-004` (TopBar search not routing) -> **resolved**: Enter now navigates to `/search` with query.
- `F-005` (workflow back link to `/workflows`) -> **resolved**: navigation uses `/workflow/templates`.
- `F-006` (workflow breadcrumbs obsolete path) -> **resolved**: breadcrumbs updated to `/workflow/templates`.
- `F-021` / `DS-001` (missing `Button` outline variant) -> **resolved**: `outline` exists in DS button API.
- `F-027` (unknown route redirects to `/`) -> **obsolete**: app now serves dedicated `NotFoundPage`.

## Partially improved but still open

- `F-002` / `A11Y label`:
  - login labels are now correctly bound,
  - but global form consistency is still mixed across modules.
- `F-014` / `F-015` / `F-016` (DataTable accessibility):
  - keyboard row activation, table caption, and checkbox labels are present,
  - but explicit header semantics (`scope`, `aria-sort`) and icon-toolbar labeling remain open.

## Still open and critical in current codebase

- Mock/demo fallback spread (`placeholderData` and hardcoded datasets on transactional surfaces).
- Unsafe destructive confirmations (`window.confirm`) across many modules.
- Mobile draft flow non-persistent (`toast + navigate`), with missing offline queue.
- i18n adoption gap (infra exists, TSX usage effectively absent).
- Hardcoded locale formatting (`ru-RU` / `ru`) in shared utilities.
- Missing component-level and visual regression test coverage.
