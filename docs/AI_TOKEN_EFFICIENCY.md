# AI Token and Context Efficiency

## Goal
Reduce repeated context, speculative output, and oversized changes while retaining enough information to work safely.

## Before a task
1. Read `AGENTS.md`.
2. Read only the relevant skill and relevant sections of docs.
3. Inspect the exact files involved using search/targeted reads; do not dump the entire repository.
4. Identify existing patterns before generating new abstractions.
5. Ask the user only when a missing decision blocks safe progress.

## Keep prompts small
- Give one user story or one vertical slice per prompt.
- Include the acceptance criteria and relevant file paths.
- State what is out of scope.
- Ask for a concise plan before implementation only when the task is risky or broad.
- Do not paste full docs if the agent can read the files directly.
- Avoid asking for a complete project rewrite, all files, or every possible improvement in one request.

## Keep responses useful
Preferred response format:
- Summary (up to 5 bullets)
- Files changed
- Tests run/results
- Risks or open questions

Do not request lengthy reasoning transcripts. Ask for decisions, assumptions, evidence, and verification instead.

## Context loading policy
- Always load `AGENTS.md`.
- Load one relevant skill.
- Load only the needed sections from `PRODUCT_REQUIREMENTS.md`, `ARCHITECTURE.md`, and other docs.
- For database/auth work, also load `SECURITY_CHECKLIST.md` and `DATA_MODEL.md`.
- For poster work, load the poster skill and relevant poster requirements.
- Do not reread unrelated modules or repeat already-confirmed repository exploration within the same task unless files changed.

## Avoid token waste in code
- Prefer small patches over rewriting entire files.
- Do not regenerate lockfiles unless dependencies changed.
- Do not reformat unrelated code.
- Do not create duplicate helper components, duplicate docs, or speculative scaffolding.
- Reuse the approved data-access and validation helpers.
- Use representative test cases rather than enormous fixtures.
- Do not generate images or call paid AI APIs for routine layout rendering.

## Use checkpoints for long work
For a multi-step task, maintain a short task note only if needed:
- Goal and ticket ID
- Relevant files
- Decisions made
- Files changed
- Commands/results
- Next action
Keep it under 30 lines. Update one note instead of creating a new status document per step. Do not store secrets or personal data in notes.

## Token-efficient task prompt
Use `docs/AI_TASK_TEMPLATE.md`. Replace placeholders; delete irrelevant sections. Ask the agent to inspect first and stop if the repository differs materially from assumptions.

## Definition of efficient
Efficiency does not mean skipping tests, security review, or acceptance criteria. Never save tokens by ignoring data integrity, guessing APIs, omitting error states, or claiming unverified success.
