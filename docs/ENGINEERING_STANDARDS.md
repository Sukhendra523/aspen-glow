# Engineering Standards

## General
- Prefer readable, straightforward code over clever abstractions.
- Keep each change focused on one story or tightly related concern.
- Follow local conventions after inspecting nearby files.
- Use descriptive names and small functions with clear responsibilities.
- Avoid duplication, but do not introduce generic frameworks before a second real use case exists.
- Avoid dead code, unused imports, broad catch blocks, unexplained magic numbers, and commented-out code.
- Do not use `any` or disable lint rules as a shortcut. If TypeScript is not configured, do not migrate the entire app solely for a small feature.

## React
- Use function components and hooks.
- Keep components focused; extract reusable UI only when it has a clear contract.
- Keep side effects in appropriate hooks or explicit event handlers.
- Do not mutate React state or props.
- Avoid effects for values that can be derived during render.
- Use stable keys for lists.
- Handle loading, empty, error, success, and disabled states.
- Avoid storing duplicated derived state.
- Keep form state and server state distinct.
- Do not put secrets or authorization decisions solely in the UI.
- Follow the React and installed library versions actually present in the lockfile.

## Material UI and styling
- Reuse the project's existing Material UI/Emotion patterns.
- Prefer shared theme tokens for brand colors, spacing, and typography.
- Avoid mixing multiple styling systems in one component without a clear reason.
- Ensure responsive layouts and visible focus states.
- Do not use color as the only way to convey status.
- Keep public salon branding configurable rather than hardcoded in many components.

## JavaScript/TypeScript
- Prefer `const`; use `let` only for reassignment.
- Validate external data at boundaries.
- Represent domain states with explicit types/unions where available.
- Use integer INR values for prices in the initial product unless requirements change.
- Avoid floating-point arithmetic for money.
- Do not trust browser-supplied IDs, prices, roles, or statuses.
- Use `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })` or a centralized equivalent for display.

## Forms and validation
- Labels must be visible and associated with controls.
- Validate required fields, lengths, URLs, numbers, file types, and file sizes.
- Client validation improves UX; database/server validation is authoritative.
- Show field-level errors and preserve values after recoverable failures.
- Prevent duplicate submissions while a request is pending.
- Confirm destructive operations and warn about unsaved changes.

## Data access
- Centralize queries and mutations by domain.
- Select only required columns.
- Handle provider errors explicitly.
- Do not assume hidden UI controls secure data.
- Use transactions/atomic server-side operations for multi-step changes that must be consistent.
- Keep database migrations in version control.
- Add constraints and indexes based on query patterns, not speculation.
- Do not silently hard-delete referenced records.

## Security and privacy
- Never commit `.env` files or credentials.
- Frontend build variables are public; never place server secrets in them.
- Use least-privilege RLS and storage policies.
- Disable public sign-up unless explicitly approved.
- Validate redirects and URL schemes.
- Sanitize untrusted content; do not inject user-provided HTML.
- Do not log passwords, access tokens, recovery links, or personal data unnecessarily.
- Review dependencies and lockfile changes.

## Testing
- Test business rules and failure paths, not only happy paths.
- Test authorization at the data/API boundary.
- Include regression tests for package/service/bundle relationships and poster snapshots.
- Use deterministic fixtures; do not rely on production data.
- Never change a test to weaken its assertion merely to get a green build.
- Report tests not run and why.

## Accessibility
- Keyboard navigation and visible focus.
- Programmatic labels and meaningful accessible names.
- Dialog focus handling.
- Errors announced and associated with fields.
- Sufficient contrast and readable type.
- Touch-friendly controls on mobile.
- Avoid hover-only actions.

## Git
- Use small, descriptive commits.
- Do not commit build outputs unless the repository's deployment workflow explicitly requires them.
- Never commit secrets, user data, temporary exports, or unrelated formatting changes.
- Inspect `git diff` and `git status` before finishing.
