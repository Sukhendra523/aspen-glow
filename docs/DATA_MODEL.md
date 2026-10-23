# Proposed Data Model

This is a starting proposal. Confirm against actual existing code and approved migrations before implementation.

## Tables
- `profiles`: auth user ID, display name, role/status. Do not trust client-supplied role values.
- `services`: name, description, icon identifier, standalone price in INR whole rupees, status, timestamps.
- `packages`: name, description, icon identifier, package price, status, timestamps.
- `package_services`: package ID, service ID, display order, optional package-specific service price override or inclusion metadata.
- `bundles`: name, description, optional promotional price, status, timestamps.
- `bundle_packages`: bundle ID, package ID, display order.
- `brand_settings`: brand name, logo asset reference, palette, approved font identifiers.
- `contact_settings`: phone, WhatsApp, address, optional booking URL.
- `festivals`: canonical name, optional region/category, active flag.
- `poster_templates`: name, supported formats, versioned layout/theme configuration, active flag.
- `posters`: campaign name, festival/template references, status, structured config, immutable content snapshot, export metadata.
- Optional `content_versions`: entity type/ID, snapshot, timestamp, actor where appropriate.

## Rules
- Use stable primary keys and foreign keys.
- Add created/updated timestamps where useful.
- Use explicit status values; avoid ambiguous booleans when lifecycle has multiple states.
- Store money as integer INR whole rupees initially; do not use floating point.
- Package price is independent of sum of service prices.
- Bundle price is independent of sum of component package prices.
- Use uniqueness constraints where business semantics require them.
- Protect every exposed table with RLS.
- Public SELECT should be limited to published, public-safe records.
- Admin writes require the intended admin role.
- A browser-provided role is never authoritative.
- Define archive and delete behavior before adding cascading deletes.
- Preserve poster snapshots independently of current source records.

## Poster snapshot
A snapshot should contain enough data to reproduce the approved poster without relying on mutable current names/prices. Consider storing:
- brand name/logo reference and palette at creation time;
- campaign text and festival label;
- package/bundle names, prices, service labels and inclusions;
- contact information;
- template ID/version and theme configuration;
- output dimensions and export settings.

Do not store secrets or unnecessary customer personal data in snapshots.
