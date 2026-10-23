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
- [x] **Ticket 3: Service Catalogue CRUD (`/admin/services`)** *(Implemented — awaiting user test run)*
  - Created migration `supabase/migrations/20261023000003_service_catalogue.sql` (`public.services` table with integer INR prices, categories, inclusions JSONB, lifecycle status, forced RLS, and salon seed data).
  - Created `serviceCatalogue.js` and `serviceCatalogueService.js` with integer INR formatting and boundary validation.
  - Built `/admin/services` (`AdminServicesPage.js`) with search/category/status filtering, create/edit form, unsaved-changes tracking, and archive confirmation dialog.
  - Wired `/admin/services` in `App.js` and `AdminDashboardPage.js`, and added `ServiceCatalogue.test.js`.
- [ ] **Ticket 4: Package Management CRUD (`/admin/packages`) & Public Catalogue Cutover**
- [ ] **Ticket 5: Bundle Management CRUD (`/admin/bundles`)**
- [ ] **Ticket 6: Media Library & Safe Asset Upload**
- [ ] **Ticket 7: Festival Catalogue & Poster Templates**
- [ ] **Ticket 8: Poster Studio Draft Persistence & PNG Export**

## Current Checkpoint
- **Active Ticket:** Ticket 3 (`feat/service-catalogue`)
- **Files Changed:** `supabase/migrations/20261023000003_service_catalogue.sql`, `src/constants/serviceCatalogue.js`, `src/services/serviceCatalogueService.js`, `src/pages/admin/AdminServicesPage.js`, `src/pages/admin/AdminDashboardPage.js`, `src/App.js`, `src/__tests__/ServiceCatalogue.test.js`, `docs/WORK_LOG.md`.
- **Next Action:** User runs `npm test -- --watchAll=false` to verify Ticket 3 tests and approves proceeding to Ticket 4.
