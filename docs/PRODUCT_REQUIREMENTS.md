# Product Requirements — Aspen Glow CMS

## Product vision
Enable Shilpi, owner of Aspen Glow by Shilpi, to manage salon content and create festival posters without developer assistance, while keeping the public website accurate, branded, and secure.

## Users
- **Administrator:** Shilpi; initially the only authorized CMS user.
- **Public visitor:** Reads published salon content and uses configured contact/booking paths.
- **Developer/maintainer:** Maintains code, backend configuration, releases, and recovery procedures.

## Core modules
1. Authentication: login, logout, password recovery/change, session handling.
2. Dashboard and navigation.
3. Service catalogue.
4. Package management.
5. Bundle management.
6. Brand settings: name, logo, colors, approved typography/motifs.
7. Contact settings: phone, WhatsApp, address, optional booking URL.
8. Festival catalogue and campaign copy.
9. Poster studio: select package/bundle, template, theme, festival; preview, save draft, export PNG.
10. Public publishing: only approved published content is visible publicly.
11. Media library and safe asset lifecycle.
12. Quality: tests, accessibility, deployment, monitoring, backup/recovery documentation.

## Business rules
- Public visitors do not need to authenticate.
- CMS writes require authenticated, explicitly authorized administrators.
- Public sign-up is disabled by default.
- Draft and archived content is not shown in public catalogue queries.
- A package has its own price independent of service prices.
- A bundle contains existing packages and may have its own promotional price.
- Service definitions are reusable; package/service relationships are stored separately.
- Prefer archiving to hard deletion when a record is referenced.
- Existing saved posters use snapshots of relevant content; source edits do not silently rewrite old posters.
- Saving a poster draft does not publish it to the public website.
- Poster export does not publish a campaign.
- Do not invent prices, services, validity dates, contact information, or marketing claims.
- Use INR and whole rupees for the initial price model unless the product owner approves otherwise.

## MVP scope
- Secure single-admin access and recovery.
- Service, package, and bundle CRUD.
- Branding and contact management.
- Database-backed public content with draft/published/archived lifecycle.
- Migration of existing hardcoded public content.
- First reusable poster templates, festival selector, preview, and PNG export.
- Automated checks and release documentation.

## Later scope
- Multiple admin roles.
- Detailed content version history.
- QR codes, extra export formats, richer drag-and-drop editing, analytics, optional AI-assisted copy/design.
- Paid services or plans only after explicit cost review.

## Acceptance criteria standard
Each story must specify: happy path, validation, loading/empty/error states, authorization, persistence, and relevant accessibility behavior. For relationships, also specify delete/archive behavior. For posters, specify snapshot and export behavior.

## Product success signals
- Owner can update package and contact details without code changes.
- Public website shows only intended published content.
- No unauthorized writes are possible through direct API calls.
- A poster can be generated from saved data, reviewed, and downloaded.
- Saved poster content remains stable when source catalogue values change.
