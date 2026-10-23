# GitHub Copilot Instructions

Follow the repository-wide rules in `AGENTS.md`. Before making a change, inspect the relevant code and read the corresponding document under `docs/`.

Priority rules:
- Never expose privileged secrets in frontend code.
- Treat client-side guards as UX only; enforce authorization in Supabase policies.
- Keep changes scoped and reuse established project patterns.
- Preserve data integrity and saved poster snapshots.
- Add tests for changed behavior and do not claim unrun tests passed.
- Update documentation for schema, architecture, environment, or security changes.
- Do not perform destructive migrations or production operations without explicit approval.
