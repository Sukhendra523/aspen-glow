# Architecture Decision Records (ADRs)

Keep approved decisions here. New decisions should be added as dated ADRs rather than silently changing the architecture.

## ADR-001: Preserve the existing React frontend
**Status:** Proposed  
**Decision:** Reuse the existing React application and current UI stack initially. Add the CMS as an administration area rather than rewriting the public website.  
**Reason:** Reduce migration risk and preserve existing visual behavior.  
**Consequences:** Inspect the actual routing/build setup before implementation; static hosting still needs a managed backend.

## ADR-002: Use a managed backend for auth, database, and media
**Status:** Proposed  
**Decision:** Evaluate/initially use Supabase Auth, PostgreSQL, and Storage.  
**Reason:** Avoid operating a custom backend for a small salon CMS.  
**Consequences:** Free-tier limits, recovery email delivery, backups, and provider configuration must be verified. RLS is mandatory. Revisit if cost, compliance, or product needs change.

## ADR-003: Browser-only poster rendering for MVP
**Status:** Proposed  
**Decision:** Generate posters in the browser using version-compatible rendering tooling and approved assets.  
**Reason:** Avoid paid image-generation APIs and simplify initial operations.  
**Consequences:** Cross-origin image rules, fonts, canvas dimensions, and mobile memory use must be tested. This does not generate new AI artwork.

## ADR-004: Snapshot saved posters
**Status:** Proposed  
**Decision:** Persist the relevant content and design configuration when a poster draft is saved.  
**Reason:** Existing marketing material must not silently change after a price or brand update.  
**Consequences:** Snapshot schema/versioning and media retention need clear rules.

## ADR template
### ADR-NNN: Title
- **Status:** Proposed / Accepted / Superseded
- **Date:**
- **Context:**
- **Decision:**
- **Alternatives considered:**
- **Security/data implications:**
- **Consequences:**
- **Approval:** Product owner / engineering reviewer
