# Repository Instructions for AI Coding Agents

## Mission
Build and maintain the Aspen Glow by Shilpi salon website and its owner-operated CMS. The owner must be able to manage services, packages, bundles, brand settings, contact details, and festival posters without editing source code.

## Read before coding
- Always read this file first.
- For product behavior, consult `docs/PRODUCT_REQUIREMENTS.md`.
- For architecture and boundaries, consult `docs/ARCHITECTURE.md`.
- For coding rules, consult `docs/ENGINEERING_STANDARDS.md`.
- For security-sensitive work, consult `docs/SECURITY_CHECKLIST.md`.
- For database changes, read `docs/skills/secure-data-change/SKILL.md`.
- For CRUD work, read `docs/skills/implement-crud-module/SKILL.md`.
- For poster work, read `docs/skills/build-poster-template/SKILL.md`.
- For code review, read `docs/skills/review-change/SKILL.md`.

## Non-negotiable guardrails
1. **Inspect first.** Read relevant source files, `package.json`, current routes, tests, and existing conventions before proposing edits. Do not assume the target architecture is already implemented.
2. **Scope narrowly.** Implement only the requested ticket and its necessary dependencies. Do not refactor unrelated files.
3. **No invented APIs.** Confirm library APIs against installed versions and official docs when uncertain. Do not upgrade dependencies casually.
4. **Security is enforced server-side.** UI route guards are UX, not authorization. Enforce access through Supabase Auth, RLS, storage policies, constraints, and safe server-side operations where needed.
5. **Never expose privileged secrets.** No service-role keys, database passwords, SMTP credentials, or other server secrets in React code, `REACT_APP_*`, committed files, screenshots, logs, or prompts.
6. **No public self-registration by default.** The CMS is initially single-admin. Use explicit provisioning and disable public sign-up unless product owner approves a change.
7. **Data integrity first.** Preserve package/service and bundle/package relationships. Prefer archive/deactivate over hard deletion for referenced records.
8. **Snapshots are immutable by default.** Editing current package, branding, or contact data must not silently mutate saved poster snapshots.
9. **No silent business-rule changes.** Do not invent prices, package contents, contact details, legal claims, or promotion validity dates. Flag missing information.
10. **No unsafe destructive actions.** Never drop tables, delete production data, rotate credentials, change billing, or deploy to production without explicit user approval.
11. **Tests are part of the change.** Add or update tests for changed behavior. Never claim a test passed unless it was actually run and passed.
12. **Do not suppress failures.** No empty catch blocks, broad lint disables, `any` to bypass typing, or skipped tests to make CI green without documented justification.
13. **Accessibility matters.** Use labels, keyboard access, visible focus, readable errors, and non-hover-only actions.
14. **Do not add dependencies without justification.** Prefer existing packages. If adding one, explain why, check maintenance/licensing/size, and update lockfile.
15. **Keep docs aligned.** Update relevant docs for changes to architecture, data models, security, environment variables, or developer workflow.

## Required workflow
1. Restate the ticket goal and acceptance criteria in 2–5 bullets.
2. Inspect relevant files and report any uncertainty.
3. Identify the smallest implementation plan and tests.
4. Make the change in focused steps.
5. Run targeted tests, lint/type checks if configured, and production build when feasible.
6. Inspect the final diff for unrelated edits, secrets, generated files, and accidental data changes.
7. Report: summary, files changed, commands run/results, security/data considerations, and remaining gaps.

## Stop and ask before proceeding when
- Requirements conflict or acceptance criteria are ambiguous in a way that affects data/security.
- A change requires a new paid service, billing, domain, account, or production credential.
- A migration may delete/transform existing user data or cannot be safely rolled back.
- A requested shortcut would weaken authorization or expose private data.
- The repository does not contain the expected file or implementation and assumptions would materially affect the design.

## Code change boundaries
- Do not reformat the entire repository for a small feature.
- Do not replace existing UI libraries without an approved decision.
- Do not create parallel data-access implementations for the same domain.
- Do not hardcode salon content in components when it belongs in managed data.
- Do not commit generated poster exports, secrets, local environment files, or customer personal data.
- Keep PRs small enough to review and revert.

## Done means
Acceptance criteria met; relevant tests pass; no known secret or authorization issue introduced; UI handles loading/empty/error states; docs updated when needed; final response accurately states what was and was not verified.
