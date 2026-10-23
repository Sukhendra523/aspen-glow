# Aspen Glow CMS — Implementation Plan & Work Log

## Approved Decisions
- **Hosting & Routing:** Deploy to **Netlify** (Free Tier) using `BrowserRouter` with SPA fallback (`public/_redirects`).
- **Backend & Storage:** **Supabase** (Free Tier) — Auth, PostgreSQL with Row Level Security (RLS), and Storage.
- **Catalogue Classification:**
  - `services`: Standalone and categorized services (`makeupServices`, `bridalServices`, `hairServices`, and Mehndi Artistry) with category, description, and optional inclusions/items.
  - `packages`: Multi-service beauty packages (`Basic Glow`, `Radiant Refresh`, `Diamond Glow`, `Royal Treatment`) linked to reusable `services` via `package_services`.
  - `bundles`: Promotional combinations of existing packages via `bundle_packages`.
- **Poster Engine:** Browser-side canvas rendering (`konva` / `react-konva`) with immutable content snapshots and PNG export.
- **Command Execution Policy:** Agent does not run `npm test`, `npm run build`, or `npm install` directly; user runs these commands locally and shares results.

## Ticket Roadmap & Progress
- [x] **Ticket 1: Backend Foundation, Admin Auth & Guardrails** *(Completed — 8/8 tests passing)*
- [x] **Ticket 2: Brand & Contact Settings Module + Public Cutover** *(Completed — 16/16 tests passing)*
- [x] **Ticket 3: Service Catalogue CRUD (`/admin/services`)** *(Completed — 22/22 tests passing)*
- [x] **Ticket 4: Package Management CRUD (`/admin/packages`) & Public Catalogue Cutover** *(Completed — 27/27 tests passing)*
- [x] **Ticket 5: Bundle Management CRUD (`/admin/bundles`)** *(Completed — 32/32 tests passing)*
- [x] **Ticket 6: Media Library & Safe Asset Upload (`/admin/media`)** *(Implemented — awaiting user test run)*
  - Created migration `supabase/migrations/20261023000006_media_library_and_storage.sql` configuring `salon-media` bucket (2 MB limit, raster PNG/JPEG/WebP only), `storage.objects` RLS, and `public.media_assets` table.
  - Created `src/services/mediaService.js` with strict MIME/extension/size validation (blocking SVG and active formats), path-traversal-safe path generation, brand logo assignment, and archiving.
  - Built `/admin/media` (`src/pages/admin/AdminMediaPage.js`) and wired it in `src/App.js` and `src/pages/admin/AdminDashboardPage.js`.
  - Added `src/__tests__/MediaLibrary.test.js`.
- [ ] **Ticket 7: Festival Catalogue & Poster Templates**
- [ ] **Ticket 8: Poster Studio Draft Persistence & PNG Export**

## Current Checkpoint
- **Active Ticket:** Ticket 6 (`feat/media-library`)
- **Files Changed:** `supabase/migrations/20261023000006_media_library_and_storage.sql`, `src/services/mediaService.js`, `src/pages/admin/AdminMediaPage.js`, `src/pages/admin/AdminDashboardPage.js`, `src/App.js`, `src/__tests__/MediaLibrary.test.js`, `docs/WORK_LOG.md`.
- **Next Action:** User runs `npm test -- --watchAll=false src/__tests__/MediaLibrary.test.js` to verify Ticket 6 tests and approves proceeding to Ticket 7.
