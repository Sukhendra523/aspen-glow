# Skill: Implement a CRUD Module

## Use when
Adding or changing a data-backed service, package, bundle, branding, contact, or similar CMS module.

## Required context
Read `AGENTS.md`, `docs/PRODUCT_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/ENGINEERING_STANDARDS.md`, and `docs/DATA_MODEL.md` sections relevant to the entity.

## Workflow
1. Inspect the closest existing module and reuse its patterns.
2. Confirm entity fields, lifecycle states, relations, and acceptance criteria.
3. Confirm authorization and public/private visibility.
4. Implement or update data-access functions before wiring UI.
5. Implement list, search if required, create/edit form, validation, and detail states.
6. Implement loading, empty, error, success, disabled, and unsaved-change behavior.
7. Implement archive/delete checks for referenced data.
8. Add unit/component tests and data-boundary tests where practical.
9. Verify refresh persistence and public query behavior.
10. Inspect the diff and document any schema/config changes.

## Must-check edge cases
- Invalid or missing fields.
- Duplicate submit.
- Network failure after user input.
- Record referenced by another entity.
- Draft/archived visibility.
- Unauthorized direct API mutation.
- Mobile layout and keyboard use.

## Output
Summarize behavior, files changed, tests/results, authorization considerations, and unresolved questions. Do not claim completion when key checks were not run.
