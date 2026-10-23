# Aspen Glow CMS — Implementation Plan & Work Log

## Approved Decisions
- **Hosting & Routing:** Deploy to **Netlify** (Free Tier) using `BrowserRouter` with SPA fallback (`public/_redirects`).
- **Backend & Storage:** **Supabase** (Free Tier) — Auth, PostgreSQL with Row Level Security (RLS), and Storage.
- **Catalogue Classification:**
  - `services`: Standalone and categorized services (`makeupServices`, `bridalServices`, `hairServices`, and Mehndi Artistry) with category, description, and optional inclusions/items.
  - `packages`: Multi-service beauty packages (`Basic Glow`, `Radiant Refresh`, `Diamond Glow`, `Royal Treatment`) linked to reusable `services` via `package_services`.
  - `bundles`: Promotional combinations of existing packages via `bundle_packages`.
- **Poster Engine:** Browser-side HTML5 `<canvas>` 2D rendering with immutable content snapshots and PNG export (zero extra npm dependencies).
- **Command Execution Policy:** Agent does not run `npm test`, `npm run build`, or `npm install` directly; user runs these commands locally and shares results.

## Ticket Roadmap & Progress
- [x] **Ticket 1: Backend Foundation, Admin Auth & Guardrails** *(Completed — 8/8 tests passing)*
- [x] **Ticket 2: Brand & Contact Settings Module + Public Cutover** *(Completed — 16/16 tests passing)*
- [x] **Ticket 3: Service Catalogue CRUD (`/admin/services`)** *(Completed — 22/22 tests passing)*
- [x] **Ticket 4: Package Management CRUD (`/admin/packages`) & Public Catalogue Cutover** *(Completed — 27/27 tests passing)*
- [x] **Ticket 5: Bundle Management CRUD (`/admin/bundles`)** *(Completed — 32/32 tests passing)*
- [x] **Ticket 6: Media Library & Safe Asset Upload (`/admin/media`)** *(Completed — 36/36 tests passing)*
- [x] **Ticket 7: Festival Catalogue & Poster Templates (`/admin/posters`)** *(Completed — 41/41 tests passing)*
- [x] **Ticket 8: Poster Studio Draft Persistence & PNG Export (`/admin/posters`)** *(Implemented — awaiting user test run)*
  - Fixed unmounted/null-client `act(...)` warning in `src/pages/PublicHomePage.js` and `src/__tests__/BrandContactSettings.test.js`.
  - Added `buildPosterExportFilename` and `exportPosterToPng` in `src/poster/posterRenderer.js`.
  - Created `src/services/posterService.js` (`fetchAdminPosters`, `savePosterDraft`, `recordPosterExportMetadata`, `archivePosterRecord`).
  - Updated `src/pages/admin/AdminPosterStudioPage.js` with Save/Update Draft, Reopen Saved Snapshot (`Snapshot Mode: Immutable`), explicit Refresh Snapshot option, PNG Export with retryable error alert, and Archive Poster Draft confirmation.
  - Added `src/__tests__/PosterPersistenceAndExport.test.js`.

## Current Checkpoint
- **Active Ticket:** Ticket 8 (`feat/poster-persistence-and-export`)
- **Files Changed:** `src/pages/PublicHomePage.js`, `src/poster/posterRenderer.js`, `src/services/posterService.js`, `src/pages/admin/AdminPosterStudioPage.js`, `src/__tests__/BrandContactSettings.test.js`, `src/__tests__/PosterTemplates.test.js`, `src/__tests__/PosterPersistenceAndExport.test.js`, `docs/WORK_LOG.md`.
- **Next Action:** User runs `npm test -- --watchAll=false` to verify all 8 ticket test suites and `npm run build` for final release verification.
