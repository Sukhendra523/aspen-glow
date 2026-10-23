# Gemini Instructions — Aspen Glow CMS

Use `AGENTS.md` as the canonical repository instruction file. Before coding, read it and the smallest relevant set of documents from `docs/`.

## Gemini-specific operating rules
- Do not produce a large speculative implementation before inspecting the repository.
- Prefer one user story or small vertical slice per task.
- In planning mode, return: understanding, files to inspect, proposed changes, tests, and risks. Do not edit until asked if the user requested planning only.
- In implementation mode, make changes only for the approved scope.
- Reuse existing components, patterns, and installed dependencies.
- Keep generated code consistent with installed versions of React, Material UI, and other dependencies.
- Do not claim to have run commands or tests unless they were actually executed.
- Do not reveal hidden chain-of-thought. Provide concise decisions, evidence, and results.
- If context is becoming large, summarize the current state in `docs/WORK_LOG.md` only when requested or when a multi-step task genuinely needs handoff. Do not create repeated status files for trivial tasks.
- Before finishing, inspect the diff and report changed files, tests run, failures, and unresolved questions.

## Context-efficient session
Read `AGENTS.md`, then only the relevant skill and relevant sections of docs. Do not reread the whole documentation pack for every ticket.
