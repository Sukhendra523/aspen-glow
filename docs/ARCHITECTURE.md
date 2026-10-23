# Architecture — Aspen Glow CMS

## Current-state caution
The repository is a React static-site application using GitHub Pages deployment conventions. Inspect the actual source before implementation. Do not assume a backend, router, TypeScript configuration, or testing framework exists unless verified.

## Target architecture
- **Frontend:** Existing React application; public site and `/admin/*` CMS area.
- **Hosting:** Static hosting (GitHub Pages initially).
- **Authentication:** Supabase Auth.
- **Data:** Supabase PostgreSQL with foreign keys, constraints, and Row Level Security (RLS).
- **Media:** Supabase Storage with explicit policies and size/type validation.
- **Poster rendering:** Browser-side rendering using a selected, version-compatible canvas/template library (candidate: React Konva/Konva).
- **Tests:** Use installed tooling first; add Vitest/React Testing Library/Playwright only after confirming compatibility and making an explicit dependency decision.

## Logical boundaries
1. **UI/presentation:** components, pages, forms, dialogs.
2. **Domain:** service/package/bundle rules, status transitions, price formatting, poster snapshot rules.
3. **Data access:** typed functions for querying and mutating Supabase records.
4. **Infrastructure:** Supabase client, environment configuration, storage helpers.
5. **Poster engine:** campaign input, snapshot resolver, template configuration, renderer, export adapter.
6. **Public content layer:** reads only published, public-safe records.

Components should not contain ad hoc SQL, duplicate authorization assumptions, or scattered raw Supabase calls. Keep data access and domain rules centralized.

## Data flow
- Admin signs in through Supabase Auth.
- UI route guard improves navigation UX.
- Every database/storage operation is independently authorized by RLS/storage policies.
- Admin creates/edits draft records.
- Publishing changes a validated record's publication state.
- Public pages query only published records.
- Poster generation resolves source content, creates a stable snapshot, renders it, and optionally saves the draft/export metadata.

## Security boundary
The browser is untrusted. Values, IDs, roles, prices, and publication states sent by the client must be validated/enforced by the database or a trusted server-side operation. Never embed a service-role/secret key in the static bundle. If an operation requires privileged credentials, implement it in a trusted backend/edge function with authorization checks.

## Deployment
- Public and admin frontend are built together initially unless route isolation justifies a separate app.
- Verify the repository's configured GitHub Pages base path and client-side routing behavior.
- Supabase migrations are versioned and reviewed.
- Use separate development/staging and production configuration where practical.
- Never run a destructive migration directly against production without backup, review, and explicit approval.

## Failure behavior
- Show loading, empty, and error states.
- Preserve form inputs after failed saves where possible.
- Avoid showing secrets, SQL errors, stack traces, or tokens to end users.
- Export failures must be visible and retryable.
- If public content cannot load, show a safe fallback/error; do not accidentally expose drafts.

## Architectural constraints
- Reuse the existing React and UI stack unless a decision record approves replacement.
- Prefer relational tables for services, packages, and bundles.
- Use stable IDs, timestamps, and explicit lifecycle status.
- Preserve snapshots for saved posters.
- Do not use browser local storage as the authoritative source of business data or authorization.
