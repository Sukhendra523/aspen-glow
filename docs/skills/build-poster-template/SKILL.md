# Skill: Build or Change a Poster Template

## Use when
Adding a layout/theme, changing poster composition, adding an export preset, or fixing PNG rendering.

## Required context
Read `AGENTS.md`, poster requirements in `docs/PRODUCT_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, and `docs/TEST_STRATEGY.md`.

## Workflow
1. Inspect the existing poster renderer and installed dependency versions.
2. Define template ID/version, supported dimensions, theme tokens, and content slots.
3. Define required/optional fields and fallback behavior.
4. Render from a stable content snapshot; do not scatter source data lookups across visual components.
5. Apply INR formatting consistently.
6. Validate text length, overflow, contrast, logo placement, and contact readability.
7. Ensure export includes artwork only, not editor controls.
8. Test local fonts and same-origin/CORS-compatible images.
9. Test output dimensions, filename, and export failure handling.
10. Confirm edits to current source data do not silently mutate saved posters.

## Do not
- Call paid image-generation APIs for routine layout.
- invent salon details or offer dates.
- depend on remote images that may disappear or taint the canvas.
- treat a screenshot of the editor as the final export.
- overwrite existing saved campaigns when changing a template.

## Output
Provide a brief description of the template, supported inputs/dimensions, files changed, export verification, and known rendering limitations.
