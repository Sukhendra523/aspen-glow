# Security Checklist

Use this checklist for every authentication, database, storage, publishing, and deployment change.

## Authentication
- [ ] Public sign-up disabled unless explicitly approved.
- [ ] Admin identity is provisioned through a trusted process.
- [ ] Session restore, expiry, logout, and recovery are tested.
- [ ] Recovery responses do not reveal account existence.
- [ ] Redirect targets are validated.
- [ ] Passwords and recovery tokens are never logged.

## Authorization and database
- [ ] RLS is enabled on every exposed table.
- [ ] Anonymous SELECT returns only intended published public data.
- [ ] Anonymous INSERT/UPDATE/DELETE are denied.
- [ ] Admin policies verify the trusted authenticated identity/role.
- [ ] Users cannot self-promote or edit their role.
- [ ] Constraints protect relationships and required fields.
- [ ] Direct API calls are tested; UI-only protection is not accepted.
- [ ] Policies are reviewed for both permissive and restrictive interactions.

## Storage
- [ ] Uploads require authorization.
- [ ] File size and allowed MIME/type are checked.
- [ ] Public-read assets are intentionally public; private assets are not.
- [ ] File paths do not grant unintended access.
- [ ] Replacement/deletion does not break historical posters unexpectedly.
- [ ] SVG or other active formats are handled safely; raster formats are preferred where possible.

## Frontend and secrets
- [ ] No service-role/secret key in source, bundle, public config, or logs.
- [ ] `.env` files are ignored and not committed.
- [ ] Error messages do not expose SQL, stack traces, tokens, or internal configuration.
- [ ] User content is rendered as text unless safely sanitized by a deliberate design.
- [ ] URL schemes and external links are validated.

## Operations
- [ ] Migration is reviewed and tested on non-production data.
- [ ] Backup/rollback plan exists for risky changes.
- [ ] Production deployment requires explicit approval.
- [ ] Dependencies and lockfile changes are reviewed.
- [ ] Logs contain no unnecessary personal data.
