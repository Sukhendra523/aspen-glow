# Reusable AI Development Skills

A skill is a small, repeatable workflow for a recurring engineering task. Keep skills task-specific and concise; do not duplicate all repository instructions in every skill.

## Available skills
- `implement-crud-module/SKILL.md`: implement a data-backed catalogue module.
- `secure-data-change/SKILL.md`: plan and validate schema/RLS/storage changes.
- `build-poster-template/SKILL.md`: add or change a poster template and export path.
- `review-change/SKILL.md`: review a patch for correctness, security, and maintainability.

## How agents should use skills
1. Load `AGENTS.md`.
2. Identify the task type.
3. Read only the matching skill.
4. Apply the checklist and report evidence.
5. Improve a skill only after a real repeated failure or a useful lesson is discovered.

## Skill authoring standard
Each skill should state: when to use it, required context, step-by-step workflow, safety checks, verification, and expected output. Avoid long tutorials, duplicated standards, and tool-specific commands that may not exist in this repository.
