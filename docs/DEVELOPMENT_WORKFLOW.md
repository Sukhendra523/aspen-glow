# Development Workflow

## One ticket at a time
1. Select one issue with clear acceptance criteria.
2. Confirm dependencies and priority.
3. Read `AGENTS.md` and one relevant skill.
4. Inspect existing code and tests.
5. Write a short implementation plan.
6. Implement the smallest complete vertical slice.
7. Add/update tests.
8. Run targeted checks and production build when feasible.
9. Inspect the diff and security impact.
10. Update docs if behavior, schema, configuration, or architecture changed.
11. Open a pull request with evidence and remaining gaps.
12. Merge only after required human review and CI pass.

## Branching
Use descriptive branches such as:
- `feat/auth-login`
- `feat/service-catalogue`
- `feat/package-management`
- `feat/poster-template-grid`
- `fix/poster-export-fonts`
- `chore/security-policy-tests`

Do not deploy directly from an AI agent's unreviewed worktree.

## Pull request template
### Goal
Which user story and business outcome does this deliver?

### Scope
What changed? What is explicitly out of scope?

### Acceptance criteria
- [ ] ...
- [ ] ...

### Verification
- [ ] Unit/component tests
- [ ] Integration/security checks
- [ ] Build/lint
- [ ] Manual responsive/accessibility check where relevant

### Risk
- Data/schema impact:
- Security impact:
- Rollback/recovery:
- Human approval needed:

### Evidence
List exact commands and results. State any checks not run.

## Definition of Ready
- Clear user story and acceptance criteria.
- Validation, errors, loading/empty states specified.
- Data and authorization behavior understood.
- UI or interaction described.
- Dependencies identified.

## Definition of Done
- Acceptance criteria satisfied.
- Tests updated and relevant checks pass.
- No known secrets or authorization regressions.
- Loading/empty/error states handled.
- Accessibility and responsive behavior considered.
- Documentation updated where needed.
- Diff is focused and reviewed.
- Agent report is truthful and complete.
