# Aspen Glow — Salon Website & Owner-Operated CMS

[![React 19](https://img.shields.io/badge/React-19.1.0-61dafb.svg?logo=react&logoColor=white)](https://react.dev/)
[![Material UI v7](https://img.shields.io/badge/Material--UI-7.2.0-007fff.svg?logo=mui&logoColor=white)](https://mui.com/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ecf8e.svg?logo=supabase&logoColor=white)](https://supabase.com/)
[![Netlify Deploy](https://img.shields.io/badge/Deploy-Netlify-00c7b7.svg?logo=netlify&logoColor=white)](https://www.netlify.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-50%20passed%20(9%20suites)-success.svg)](https://jestjs.io/)

A modern, responsive salon website and owner-operated Content Management System (CMS) built for **Aspen Glow**.

The application allows salon owner to autonomously manage beauty services, packages, promotional bundles, brand styling, contact info, media assets, festival occasions, and generate pixel-perfect, print-ready festival promotional posters via a **luxury browser-side canvas** engine—all (**Poster Studio**) without touching source code.

---

## Table of Contents

1. [Key Features](#key-features)
2. [Tech Stack & Architecture](#tech-stack--architecture)
3. [Project Directory Structure](#project-directory-structure)
4. [Getting Started & Local Setup](#getting-started--local-setup)
5. [Environment Variables](#environment-variables)
6. [Database Setup & Migrations](#database-setup--migrations)
7. [Core Modules & Admin CMS](#core-modules--admin-cms)
8. [Festival Poster Studio Engine](#festival-poster-studio-engine)
9. [Available Scripts](#available-scripts)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Guide (Netlify)](#deployment-guide-netlify)
12. [Security & Architectural Guardrails](#security--architectural-guardrails)
13. [Project Documentation Index](#project-documentation-index)

---

## Key Features

- **Public Luxury Website (`/`)**: High-converting, responsive showcase featuring salon branding, published service catalogues, multi-service beauty packages, promotional bundles, festive showcases, customer reviews, interactive Google Maps location, and a scannable booking QR code.
- **Single-Admin CMS Area (`/admin`)**: Password-protected administrative dashboard with secure Supabase Auth, persistent sessions, and password recovery.
- **Service Catalogue CRUD (`/admin/services`)**: Manage individual salon services across categories (*Makeup & Styling*, *Bridal & Pre-Bridal*, *Hair Services*, *Mehndi Artistry*, *Beauty & Skincare*).
- **Package Management CRUD (`/admin/packages`)**: Construct multi-service packages with custom prices, inclusion badges, and relational linkages to reusable services.
- **Bundle Management CRUD (`/admin/bundles`)**: Combine multiple packages into festive bundles with promotional pricing.
- **Festival Occasions CRUD (`/admin/festivals`)**: Manage Indian festivals and bridal occasions (Karwa Chauth, Diwali, Teej, Navratri, Wedding Season) with custom headlines, accent colors, and motif badges.
- **Media Library (`/admin/media`)**: Secure asset manager for uploading salon imagery and icons with file validation, categorized filtering, and custom icon selectors for services.
- **Brand & Contact Settings (`/admin/settings`)**: Live configuration of salon name, taglines, primary/secondary/gold theme colors, phone numbers, WhatsApp, physical address, and booking links.
- **Luxury Festival Poster Studio (`/admin/posters`)**:
  - Live interactive HTML5 `<canvas>` rendering engine.
  - 4 authentic luxury reference poster layouts (4-Column Multi-Service, Cleanup List, 3-Column Luxe Gift Columns with QR code, and Bridal & À La Carte Catalogue).
  - Tiptap-compatible rich text & typography controls (font size, luxury color swatches, uppercase, font family).
  - Text overflow auto-fitting and auto-scaling.
  - Immutable content snapshot drafts (editing live packages never corrupts saved poster history).
  - One-click high-resolution PNG export with sanitized naming conventions.

---

## Tech Stack & Architecture

- **Frontend Core:** React 19, React Router v6 (SPA routing with HTML5 history).
- **Design & UI Components:** Material-UI (MUI v7), `@emotion/react`, `@emotion/styled`, `lucide-react`.
- **Typography:** Self-hosted Google Fonts via `@fontsource/playfair-display` and `@fontsource/lato`.
- **Poster Rendering Engine:** Custom 2D Canvas vector rendering engine (`src/poster/posterRenderer.js` and `src/poster/fabricPosterEngine.js`) with chamfered price boxes, double ornate frames, notched ribbons, and asynchronous asset caching.
- **Backend & Database:** Supabase (PostgreSQL with Row Level Security, Supabase Auth, Supabase Storage).
- **Deployment & Hosting:** Netlify (Free Tier) with a Zero-Secret build pipeline and Netlify Serverless Functions for runtime configuration.
- **Automated Testing:** Jest, React Testing Library, `@testing-library/user-event`.

---

## Project Directory Structure

```text
aspen-glow/
├── netlify/
│   └── functions/
│       └── runtime-config.js      # Serverless function serving runtime config
├── public/
│   ├── _redirects                 # Netlify SPA and API redirect routing
│   ├── aspen-glow-QR-code.png     # Official scannable booking QR code
│   └── poster-assets/             # Clean transparent luxury poster ornaments
├── scripts/
│   └── build-production.js        # Zero-secret build runner for Netlify
├── src/
│   ├── __tests__/                 # Comprehensive automated test suites (9 suites, 50 tests)
│   ├── components/
│   │   ├── admin/                 # Admin CMS dialogs, navigation, icon pickers, rich text
│   │   ├── About.js               # Salon about section
│   │   ├── Contact.js             # Contact & booking section with QR code
│   │   ├── Hero.js                # Hero showcase
│   │   ├── Navbar.js              # Public navigation header
│   │   └── Services.js            # Public service & package catalogue
│   ├── constants/                 # Theme, brand defaults, service seed catalogues
│   ├── context/
│   │   └── AuthContext.js         # Supabase Auth provider with runtime client resolution
│   ├── lib/
│   │   └── supabaseClient.js      # Supabase client singleton & Proxy export
│   ├── pages/
│   │   ├── admin/                 # Admin CMS page views (Dashboard, Services, Packages, etc.)
│   │   └── PublicHomePage.js      # Public landing page
│   ├── poster/                    # Poster studio templates, canvas renderer, snapshot resolver
│   ├── services/                  # Database data access layer (Auth, Services, Packages, etc.)
│   ├── App.js                     # Root router and protected route boundaries
│   └── index.js                   # Application entry point
├── supabase/
│   └── migrations/                # Version-controlled SQL schema and RLS migrations
├── docs/                          # Architecture, data model, and engineering standards
├── netlify.toml                   # Netlify build and redirect configuration
└── package.json                   # Project dependencies and npm scripts
```

---

## Getting Started & Local Setup

### Prerequisites

- [Node.js](https://nodejs.org/) version **20.x** (recommended) or 18.x+.
- [npm](https://www.npmjs.com/) version 9.x or 10.x.
- A free [Supabase](https://supabase.com/) account.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/aspen-glow.git
   cd aspen-glow
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure local environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_PUBLISHABLE_KEY=your-supabase-public-anon-key
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the public website.
   Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) to access the CMS login.

---

## Database Setup & Migrations

The repository contains version-controlled SQL migrations in `supabase/migrations/`.

To apply these migrations to your Supabase project:
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run the migration files in sequential order:
   - `20261024000001_initial_schema.sql`: Core tables (`profiles`, `brand_settings`, `contact_settings`, `services`, `packages`, `package_services`, `bundles`, `bundle_packages`).
   - `20261024000002_rls_policies.sql`: Row Level Security policies (public read-only for published content, admin write-only).
   - `20261024000003_storage_buckets.sql`: Storage bucket configuration (`salon-media`) and upload policies.
   - `20261024000004_poster_campaigns.sql`: Saved poster drafts table (`poster_campaigns`) with JSONB snapshot columns.
   - `20261024000005_seed_initial_catalogue.sql`: Initial seed data for Aspen Glow services and packages.
   - `20261024000008_merge_poster_catalogue_data.sql`: Merged catalogue services (Cleanup packages, HD Bridal, etc.).
   - `20261024000009_custom_icons_and_festivals.sql`: Adds `festivals` table and `icon_url` columns to services/packages/bundles.
3. **Provision the Administrator Profile:**
   - Under **Authentication > Users**, invite or create the administrator email (e.g. `name@aspenglow.in`).
   - In the SQL Editor, insert the corresponding record in `public.profiles`:
     ```sql
     INSERT INTO public.profiles (id, email, display_name, role, status)
     VALUES ('<auth-user-id>', 'name@aspenglow.in', 'your name', 'admin', 'active')
     ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'active';
     ```

---

## Core Modules & Admin CMS

| Module Route | Description |
|---|---|
| `/` | Public website showcasing salon services, packages, bundles, and booking info. |
| `/admin/login` | Secure administrator authentication with password reset link. |
| `/admin` | CMS Dashboard providing quick stats, system health, and quick actions. |
| `/admin/services` | Service catalogue management with category filters, inclusions, and custom icon selectors. |
| `/admin/packages` | Multi-service beauty package builder with relational service selection and price calculation. |
| `/admin/bundles` | Promotional bundle management linking multiple packages. |
| `/admin/festivals` | Festival catalogue with default headlines, subheadlines, and accent badges. |
| `/admin/media` | Media asset library with drag-and-drop uploads and image previews. |
| `/admin/settings` | Salon brand identity, palette color pickers, contact numbers, and address settings. |
| `/admin/posters` | Luxury Poster Studio for dynamic poster generation and PNG download. |

---

## Festival Poster Studio Engine

The Poster Studio (`/admin/posters`) features an in-browser 2D Canvas rendering engine with zero heavy runtime canvas dependencies:

- **4 Reference Templates:**
  1. `royal_4col_packages_v1`: Multi-Service Packages 4-column ornate grid with bottom circular medallions and taglines.
  2. `cleanup_arch_list_v1`: Arched bride portrait with a 5-item luxury cleanup package price list and gold dotted price leaders.
  3. `luxe_3col_gift_v1`: 3-Column festive gift packages with Puja Thali artwork, circular badge, and scannable QR code.
  4. `bridal_alacarte_catalogue_v1`: Makeup & Styling grid with lower split section for Haldi/Mehndi Makeup and À La Carte haircut/mehndi pricing.
- **Immutable Snapshots:** When saving or exporting a poster, the engine captures a frozen snapshot of prices, inclusions, brand name, and contact details. Later modifications to salon services will never alter historical poster drafts.
- **Typography Toolbar:** Interactive Tiptap-style controls for font size, uppercase transform, luxury color swatches, font family, and text alignment.
- **Auto-Fit Text Scaling:** Dynamic text measurement (`drawFittedText`) ensures headlines and subheadlines automatically scale to fit within ornate frame boundaries without overflowing.

---

## Available Scripts

In the project root, you can run:

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### `npm test -- --watchAll=false`
Runs all 50 automated tests across 9 test suites in non-interactive CI mode.

### `npm run build`
Executes `node scripts/build-production.js`, building the production distribution in `build/` using a zero-secret sanitized environment.

---

## Testing Strategy

The repository includes complete test coverage across all features:

```text
 PASS  src/__tests__/MediaLibrary.test.js
 PASS  src/__tests__/BundleManagement.test.js
 PASS  src/__tests__/BrandContactSettings.test.js
 PASS  src/__tests__/PackageManagement.test.js
 PASS  src/__tests__/FestivalManagement.test.js
 PASS  src/__tests__/PosterPersistenceAndExport.test.js
 PASS  src/__tests__/AdminAuth.test.js
 PASS  src/__tests__/ServiceCatalogue.test.js
 PASS  src/__tests__/PosterTemplates.test.js

Test Suites: 9 passed, 9 total
Tests:       50 passed, 50 total
```

To run a specific test suite:
```powershell
npm test -- src/__tests__/PosterTemplates.test.js --watchAll=false
```

---

## Deployment Guide (Netlify)

The project is pre-configured for automated deployment to **Netlify (Free Tier)**.

### Zero-Secret Build Pipeline

1. **Build Sanitization:** `scripts/build-production.js` deletes `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_PUBLISHABLE_KEY` from the build environment before Create React App compiles. This guarantees that **no sensitive keys are inlined into the client-side JavaScript bundle**.
2. **Serverless Runtime Endpoint:** Netlify serverless function `netlify/functions/runtime-config.js` securely reads environment variables on the server side and exposes them via `/api/config`.
3. **Netlify Configuration:** [`netlify.toml`](file:///d:/AI/aspen-glow/netlify.toml) configures the Node 20 runtime, build commands, function directories, security headers, and SPA redirects (`public/_redirects`).

For complete, step-by-step Netlify setup instructions, see [`docs/DEPLOYMENT.md`](file:///d:/AI/aspen-glow/docs/DEPLOYMENT.md).

---

## Security & Architectural Guardrails

1. **Server-Enforced Authorization:** UI route guards are strictly for UX. All data reads and mutations are authorized server-side by PostgreSQL Row Level Security (RLS) policies.
2. **Never Expose Privileged Secrets:** The Supabase `SUPABASE_SERVICE_ROLE_KEY` must **never** be added to React code, `.env.local`, committed files, or client-side settings.
3. **No Public Registration:** Self-registration is disabled in Supabase Auth to maintain single-admin ownership.
4. **Data Integrity:** Referenced services, packages, and bundles use soft-deletions / archiving (`active = false` or `status = 'archived'`) to preserve relational integrity.
5. **Snapshot Immutability:** Saved poster drafts and export records store immutable snapshot copies to protect marketing history.

---

## Project Documentation Index

For deep dives into architecture and development guidelines, consult the documentation in `docs/`:

- [`docs/PRODUCT_REQUIREMENTS.md`](file:///d:/AI/aspen-glow/docs/PRODUCT_REQUIREMENTS.md) — Product vision, business rules, and acceptance criteria.
- [`docs/ARCHITECTURE.md`](file:///d:/AI/aspen-glow/docs/ARCHITECTURE.md) — System boundaries, data flow, and architectural constraints.
- [`docs/DATA_MODEL.md`](file:///d:/AI/aspen-glow/docs/DATA_MODEL.md) — Relational schemas, foreign keys, and snapshot structures.
- [`docs/ENGINEERING_STANDARDS.md`](file:///d:/AI/aspen-glow/docs/ENGINEERING_STANDARDS.md) — Code style, error handling, accessibility, and naming conventions.
- [`docs/SECURITY_CHECKLIST.md`](file:///d:/AI/aspen-glow/docs/SECURITY_CHECKLIST.md) — Authorization boundaries, secret isolation, and RLS review.
- [`docs/TEST_STRATEGY.md`](file:///d:/AI/aspen-glow/docs/TEST_STRATEGY.md) — Automated testing guidelines and mock patterns.
- [`docs/DEPLOYMENT.md`](file:///d:/AI/aspen-glow/docs/DEPLOYMENT.md) — Detailed Netlify deployment and Supabase configuration guide.
- [`docs/WORK_LOG.md`](file:///d:/AI/aspen-glow/docs/WORK_LOG.md) — Complete ticket roadmap, implementation history, and progress checkpoints.
- [`AGENTS.md`](file:///d:/AI/aspen-glow/AGENTS.md) — Canonical operating instructions and non-negotiable guardrails for AI coding assistants.

---

## License

Private and proprietary. Created for **Aspen Glow**. All rights reserved.
