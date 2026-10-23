# Skill: Review a Code Change

## Use when
Reviewing an AI-generated patch, pull request, migration, or release candidate.

## Review order
1. Compare the diff with the ticket acceptance criteria.
2. Look for broken flows, invalid assumptions, race conditions, and missing error states.
3. Check authorization at database/storage boundaries.
4. Check secrets, unsafe rendering, URL handling, and dependency changes.
5. Check relational integrity, archive/delete behavior, and poster snapshot stability.
6. Check accessibility, responsive behavior, and user-facing clarity.
7. Check tests for meaningful assertions and negative cases.
8. Check documentation and migration/recovery instructions.
9. Run relevant checks if tools are available; distinguish actual results from inference.
10. Report findings by severity with file/line references where available.

## Severity
- **Critical:** data exposure, privilege escalation, secret leak, destructive data loss.
- **High:** core feature broken, incorrect prices, bypassable authorization, unrecoverable migration.
- **Medium:** significant edge case, accessibility blocker, broken export, missing required state.
- **Low:** maintainability or minor UX issue.

## Output
Start with actionable findings. If no issue is found, say what was reviewed and what was not verified. Do not invent findings to fill a report.
