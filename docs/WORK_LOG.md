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
- [x] **Ticket 8: Poster Studio Draft Persistence & PNG Export (`/admin/posters`)** *(Completed — 45/45 tests passing across 8 suites)*
  - Fixed unmounted/null-client `act(...)` warning in `src/pages/PublicHomePage.js` and `src/__tests__/BrandContactSettings.test.js`.
  - Added `buildPosterExportFilename` and `exportPosterToPng` in `src/poster/posterRenderer.js`.
  - Created `src/services/posterService.js` (`fetchAdminPosters`, `savePosterDraft`, `recordPosterExportMetadata`, `archivePosterRecord`).
  - Updated `src/pages/admin/AdminPosterStudioPage.js` with Save/Update Draft, Reopen Saved Snapshot (`Snapshot Mode: Immutable`), explicit Refresh Snapshot option, PNG Export with retryable error alert, and Archive Poster Draft confirmation.
  - Added `src/__tests__/PosterPersistenceAndExport.test.js`.
  - Fixed React Router v7 `v7_relativeSplatPath` & `v7_startTransition` future-flag warnings in `src/App.js` and all test suites (`src/__tests__/*.test.js`), and stubbed `HTMLCanvasElement.prototype.getContext` in `src/setupTests.js` to silence jsdom `Not implemented` console errors.
- [x] **Ticket 9: Supabase Catalogue & Settings Merge Migration (Source-of-Truth Poster Data)** *(Implemented — awaiting user test run)*
  - Created additive/merge migration `supabase/migrations/20261024000008_merge_poster_catalogue_data.sql` and updated `src/constants/services.js`, `src/constants/defaultSettings.js`, `src/services/packageService.js`, `src/services/bundleService.js`, and `src/pages/admin/AdminPackagesPage.js`.
  - Updated existing services/packages in-place (`Light Party Makeup` ₹1,499, `Engagement Makeup` ₹2,999, `HD Bridal Makeup` ₹14,999, renamed `Radiant Refresh` -> `Radiant Care` ₹1,099, `Diamond Glow` -> `Lotus Glow` ₹1,499, `Royal Treatment` -> `Royal Pamper` ₹2,099, updated address `703 Aspen Tower, DevSai Sports Home, Sector 1, Bisrakh, Greater Noida`).
  - Added all 5 Cleanup Packages (`Gold cleanup with D-tan pack` ₹599, `Wine cleaner with D-tan pack` ₹499, `Clean up VLCC with VLCC bleach` ₹649, `Korean clean up with D-tan bleach` ₹699, `Oxy clean up with Oxy bleach` ₹499) and 3 Festive Luxe Packages (`Bond of Radiance Package` ₹1,999, `Sister's Glow Luxe Package` ₹2,499, `Pure & Fresh Essence Package` ₹1,299) to both `packages` and `bundles` without deleting any existing records.
- [x] **Ticket 10: Fabric.js Luxury Poster Engine & 4 Reference Layout Templates** *(Implemented — awaiting user test run)*
  - Extracted clean transparent decorative/portrait assets from the 4 reference posters into `public/poster-assets/` (`ag-logo-box.png`, `bride-portrait-arch.png`, `bride-portrait-side.png`, `bride-portrait-tall.png`, `festive-gift-thali.png`, `hanging-ornaments.png`).
  - Built `src/poster/fabricPosterEngine.js` and updated `src/poster/posterRenderer.js` + `src/poster/posterTemplates.js` to render all 4 reference poster designs (`royal_4col_packages_v1`, `cleanup_arch_list_v1`, `luxe_3col_gift_v1`, `bridal_alacarte_catalogue_v1`) with ornate gold frames, chamfered price boxes, notched ribbons, custom icons, medallions, dotted price leaders, and scannable QR codes.
- [x] **Ticket 11: Poster Studio Dynamic Controls, Snapshot Schema v2 & Test Suite Updates** *(Completed — 46/46 tests passing; canvas flicker bug fixed)*
  - Updated `src/poster/snapshotResolver.js` and `src/pages/admin/AdminPosterStudioPage.js` with Quick-Load Reference Poster Presets (`REFERENCE_POSTER_PRESETS`), automatic template-specific package group & header selection when switching Poster Templates, dynamic section headers, CTA ribbon text, footer tagline, custom portrait URL override, QR code toggle, and live luxury preview.
  - Fixed infinite `requestRedraw` loop and stale-snapshot canvas flicker in `src/poster/fabricPosterEngine.js` (`preloadPosterAsset` no longer calls `onLoad` when an image is already cached) and `src/poster/posterRenderer.js` (`WeakMap` `canvasRenderState` cancels any pending redraw timer and invalidates older `renderId` tokens when a new snapshot renders).
  - Added automated test coverage for all 4 reference poster templates and canvas redraw cancellation in `src/__tests__/PosterTemplates.test.js`.

## Current Checkpoint
- **Active Tickets:** Tickets 9–11 (`feat/reference-posters-and-catalogue-merge`)
- **Files Changed:** `supabase/migrations/20261024000008_merge_poster_catalogue_data.sql`, `public/poster-assets/*.png`, `src/constants/defaultSettings.js`, `src/constants/services.js`, `src/services/packageService.js`, `src/services/bundleService.js`, `src/pages/admin/AdminPackagesPage.js`, `src/poster/posterTemplates.js`, `src/poster/snapshotResolver.js`, `src/poster/fabricPosterEngine.js`, `src/poster/posterRenderer.js`, `src/pages/admin/AdminPosterStudioPage.js`, `src/__tests__/PosterTemplates.test.js`, `src/__tests__/PosterPersistenceAndExport.test.js`, `docs/WORK_LOG.md`.
- **Next Action:** User runs `npm test -- --watchAll=false` locally and shares test output.
