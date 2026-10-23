# Skill: Secure Data, Migration, and RLS Change

## Use when
Changing database schema, migrations, roles, authentication, RLS policies, storage policies, or data access.

## Workflow
1. Identify the exact table/storage resource and all read/write paths.
2. Read `docs/SECURITY_CHECKLIST.md`, `docs/DATA_MODEL.md`, and relevant ADRs.
3. Define the intended permissions for anonymous users, the admin, and any other roles.
4. Write the migration in version control; prefer additive, backward-compatible changes.
5. Add constraints/foreign keys and indexes only where justified.
6. Write policies that enforce least privilege. Do not rely on frontend route guards.
7. Test positive and negative access cases using separate identities.
8. Test direct API requests, not only UI behavior.
9. Review effects on existing data and provide rollback/recovery notes.
10. Never apply destructive production changes without explicit approval.

## Stop and ask
- A migration drops/renames data or changes meaning without a migration plan.
- The role model is ambiguous.
- A policy would make private data public.
- The task requires privileged credentials or production access.
- A rollback/recovery path is unknown for a high-risk change.

## Output
Include migration name, affected resources, permission matrix, test evidence, rollback/recovery notes, and any human approval needed.
