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
- [x] **Ticket 12 (Task 1): Poster Text Overflow Fix & Tiptap Rich Text / Typography Customization for Campaign Inputs**
  - Built `src/components/admin/RichTextCampaignField.js` providing a Tiptap-compatible rich text & typography toolbar (font family, font size in px / auto-fit, color picker + luxury swatches, bold, italic, uppercase, alignment, and style reset) for all Campaign text inputs (`headline`, `subheadline`, `secondarySubheadline`, `sectionTitle`, `sectionSubtitle`, `badgeText`, `ctaText`, `footerTagline`, `validityNote`).
  - Added `drawFittedText` in `src/poster/fabricPosterEngine.js` and updated `drawNotchedRibbon` + all 4 poster template builders in `src/poster/posterRenderer.js` to auto-scale/fit long headlines and subheadlines within their bounding boxes and apply custom per-field typography styles (`snapshot.campaign.text_styles`).
  - Fixed invisible `"✂ À LA CARTE SERVICES ✂"` pill header text in Poster 4 (`bridal_alacarte_catalogue_v1`) by explicitly setting `ctx.fillStyle = "#f1cf85"` after `drawChamferedRect`.
- [x] **Ticket 13 (Task 2): Festival Management CRUD Module (`/admin/festivals`)**
  - Extended `src/services/festivalService.js` with `FESTIVAL_CATEGORIES`, `EMPTY_FESTIVAL_FORM`, `updateFestivalRecord`, `archiveFestivalRecord`, and `restoreFestivalRecord`.
  - Created `src/pages/admin/AdminFestivalsPage.js` with full create, list, search/category/status filter, edit, reset/clear, and archive/restore confirmation dialog.
  - Added `/admin/festivals` protected route in `src/App.js`, dashboard card in `src/pages/admin/AdminDashboardPage.js`, quick navigation link in `src/pages/admin/AdminPosterStudioPage.js`, and automated tests in `src/__tests__/FestivalManagement.test.js`.
- [x] **Ticket 14 (Task 3): Original Scannable QR Code Integration in Poster Studio & Public Contact Section**
  - Updated `src/poster/fabricPosterEngine.js` and `src/poster/posterRenderer.js` to load and draw the owner's uploaded `/aspen-glow-QR-code.png` in the poster footer when QR code display is enabled (with deterministic fallback for headless test environments).
  - Updated `src/components/Contact.js` (`#contact` — **Get in Touch** section) to display the original scannable `/aspen-glow-QR-code.png` with booking caption.
- [x] **Ticket 15 (Task 4): Media Library Custom Icon Picker for Services, Packages & Bundles**
  - Created additive migration `supabase/migrations/20261024000009_custom_icons_and_festivals.sql` adding `icon_url` to `public.services`, `public.packages`, and `public.bundles` and expanding `media_assets` categories to include `icon`.
  - Created `src/components/admin/MediaLibraryIconPicker.js` and integrated it into `src/pages/admin/AdminServicesPage.js`, `src/pages/admin/AdminPackagesPage.js`, and `src/pages/admin/AdminBundlesPage.js` so the owner can choose an icon from the Media Library (or paste an icon URL) alongside built-in Material UI icons.
  - Updated `src/components/Services.js`, `src/poster/snapshotResolver.js`, and `src/poster/posterRenderer.js` to render custom `icon_url` images when configured.
- [x] **Ticket 16 (Task 5): Poster Configuration Reset & Clear Buttons (`/admin/posters`)**
  - Added **Reset to Default** and **Clear All** buttons in the Poster Configuration form header of `src/pages/admin/AdminPosterStudioPage.js` and tested them in `src/__tests__/PosterTemplates.test.js`.

## Current Checkpoint
- **Active Tickets:** Tickets 12–16 (`feat/rich-text-festivals-qr-media-icons-reset`)
- **Files Changed:** `supabase/migrations/20261024000009_custom_icons_and_festivals.sql`, `src/components/admin/RichTextCampaignField.js`, `src/components/admin/MediaLibraryIconPicker.js`, `src/pages/admin/AdminFestivalsPage.js`, `src/services/festivalService.js`, `src/services/mediaService.js`, `src/constants/serviceCatalogue.js`, `src/services/serviceCatalogueService.js`, `src/services/packageService.js`, `src/services/bundleService.js`, `src/pages/admin/AdminServicesPage.js`, `src/pages/admin/AdminPackagesPage.js`, `src/pages/admin/AdminBundlesPage.js`, `src/pages/admin/AdminDashboardPage.js`, `src/pages/admin/AdminPosterStudioPage.js`, `src/App.js`, `src/components/Contact.js`, `src/components/Services.js`, `src/poster/fabricPosterEngine.js`, `src/poster/posterRenderer.js`, `src/poster/snapshotResolver.js`, `src/__tests__/FestivalManagement.test.js`, `src/__tests__/PosterTemplates.test.js`, `docs/WORK_LOG.md`.
- **Next Action:** User runs `npm test -- --watchAll=false` locally and shares test output.
