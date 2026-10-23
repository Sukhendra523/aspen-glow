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
- [x] **Ticket 1: Backend Foundation, Admin Auth & Guardrails** *(Completed)*
  - Hardened `.gitignore` (`.env`), added `.env.example` and `public/_redirects`.
  - Created initial migration `supabase/migrations/20261023000001_init_auth_profiles.sql` (`profiles`, `set_updated_at()`, `is_admin()`, and least-privilege RLS).
  - Implemented `supabaseClient`, `authService`, `AuthContext`, `ProtectedRoute`, `PublicHomePage`, `AdminLoginPage`, `AdminResetPasswordPage`, `AdminDashboardPage`, and `AdminAuth.test.js` (8/8 tests passing, production build passing).
- [x] **Ticket 2: Brand & Contact Settings Module + Public Cutover** *(Completed)*
  - Created migration `supabase/migrations/20261023000002_brand_and_contact_settings.sql` (`brand_settings` & `contact_settings` singleton tables, RLS policies, and seed data).
  - Created `defaultSettings.js`, dynamic `buildSalonTheme` in `theme.js`, and `settingsService.js`.
  - Built `/admin/settings` (`AdminSettingsPage.js`) with live preview, field validation, and unsaved-changes tracking.
  - Connected `PublicHomePage.js`, `Navbar.js`, `Hero.js`, `Contact.js`, and `Footer.js` to published settings with safe default fallback.
  - Added `BrandContactSettings.test.js` (verified by user: 2/2 test suites, 16/16 tests passing).
- [ ] **Ticket 3: Service Catalogue CRUD (`/admin/services`)**
- [ ] **Ticket 4: Package Management CRUD (`/admin/packages`) & Public Catalogue Cutover**
- [ ] **Ticket 5: Bundle Management CRUD (`/admin/bundles`)**
- [ ] **Ticket 6: Media Library & Safe Asset Upload**
- [ ] **Ticket 7: Festival Catalogue & Poster Templates**
- [ ] **Ticket 8: Poster Studio Draft Persistence & PNG Export**

## Current Checkpoint
- **Completed Ticket:** Ticket 2 (`feat/brand-contact-settings`)
- **Files Changed:** `supabase/migrations/20261023000002_brand_and_contact_settings.sql`, `src/constants/defaultSettings.js`, `src/constants/theme.js`, `src/services/settingsService.js`, `src/context/AuthContext.js`, `src/pages/admin/AdminSettingsPage.js`, `src/pages/admin/AdminDashboardPage.js`, `src/pages/PublicHomePage.js`, `src/components/Navbar.js`, `src/components/Hero.js`, `src/components/Contact.js`, `src/components/Footer.js`, `src/App.js`, `src/__tests__/BrandContactSettings.test.js`, `AGENTS.md`, `docs/WORK_LOG.md`.
- **Commands & Results:** Verified by user: `Test Suites: 2 passed, 2 total; Tests: 16 passed, 16 total`.
- **Next Action:** Await user approval to proceed with Ticket 3 (Service Catalogue CRUD at `/admin/services`).
