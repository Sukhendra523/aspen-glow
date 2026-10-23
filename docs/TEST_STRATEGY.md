# Test Strategy

## Principles
- Tests verify observable behavior and business rules.
- Test the data boundary, not only the UI.
- Use deterministic fake salon data.
- Never use production credentials or real customer data in tests.
- Test negative cases and authorization failures.

## Layers
### Unit
- INR formatting and price validation.
- Package/bundle selection rules.
- Lifecycle transitions.
- Poster content snapshot construction.
- Template compatibility and text-overflow rules where testable.

### Component
- Form validation and error display.
- Loading, empty, and failure states.
- Package service selection and ordering.
- Branding/contact previews.
- Poster template selector and preview controls.

### Integration
- Data-access methods against a local/test backend where available.
- Constraints for package/service/bundle relationships.
- RLS policy behavior for anonymous, admin, and unauthorized identities.
- Storage upload authorization and file restrictions.
- Publishing queries exclude drafts/archived content.

### End-to-end
- Admin login and logout.
- Recovery flow initiation and completion in a test setup.
- Create/edit/archive/publish service/package/bundle.
- Update branding and contacts.
- Create a poster, preview it, save draft, reopen, export PNG.
- Verify a source price update does not alter a saved poster snapshot.
- Verify anonymous direct writes fail.

## Commands
Inspect `package.json` and existing scripts before choosing commands. Do not assume a script exists. If a test framework must be added, record the dependency decision and use versions compatible with the installed React/build stack.

## Release gate
No critical authorization test may be skipped to make a release green. Document flaky or unavailable checks accurately and resolve security-sensitive failures before release.
