# Netlify Deployment Guide — Aspen Glow by Shilpi

This document outlines the step-by-step instructions to deploy the Aspen Glow website and CMS to **Netlify (Free Tier)**.

---

## 1. Architecture & Build Configuration

- **Build Tool:** Create React App (`react-scripts build`)
- **Build Command:** `npm run build`
- **Publish Directory:** `build`
- **Node.js Target:** `20.x`
- **Routing Configuration:** Single Page Application (SPA) with deep links supported by `public/_redirects` and `netlify.toml`:
  ```toml
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```

---

## 2. Environment Variables Configuration

Configure the following environment variables in the Netlify Dashboard (**Site configuration > Environment variables**):

| Variable | Description | Security Level |
|---|---|---|
| `REACT_APP_SUPABASE_URL` | Your Supabase Project URL (`https://<project-id>.supabase.co`) | Public / Client-Safe |
| `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase Project Anonymous (`anon`) Key | Public / Client-Safe |

> [!CAUTION]
> **NEVER expose the `SUPABASE_SERVICE_ROLE_KEY`** in Netlify environment variables or client code. The client only needs the public `anon` key. Server-side security is strictly enforced via Supabase Row Level Security (RLS) policies.

---

## 3. Supabase Auth Configuration

After deploying or claiming your domain on Netlify:

1. Open your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2. **Site URL:**
   ```
   https://aspen-glow.netlify.app
   ```
   *(or your registered custom domain)*
3. **Redirect URLs (Allow list):**
   ```
   https://aspen-glow.netlify.app/**
   https://aspen-glow.netlify.app/admin/*
   https://aspen-glow.netlify.app/admin/reset-password
   http://localhost:3000/**
   ```
4. Verify that public user sign-ups remain disabled under **Auth > Providers > Email** (`Enable Signups: OFF`), ensuring single-admin provisioning.

---

## 4. Deployment Methods

### Method A: Netlify Git Continuous Deployment (Recommended)
1. Push repository changes to GitHub / GitLab / Bitbucket.
2. Sign in to [Netlify](https://app.netlify.com).
3. Click **Add new site > Import an existing project** and select your repository.
4. Netlify automatically reads the build settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
5. Add the environment variables from Section 2.
6. Click **Deploy aspen-glow-by-shilpi**.

### Method B: Netlify CLI Deployment
If deploying manually from your local terminal:
```powershell
# 1. Install or run Netlify CLI
npx netlify login

# 2. Link or create the Netlify site
npx netlify link

# 3. Build the production bundle locally
npm run build

# 4. Deploy directly to production
npx netlify deploy --prod --dir=build
```

### Method C: Netlify Drop (Manual Drag & Drop)
1. Build the production distribution locally:
   ```powershell
   npm run build
   ```
2. Navigate to [app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag and drop the generated `build` folder into the Netlify Drop target area.
4. Set environment variables under **Site settings > Environment variables** and trigger a rebuild.

---

## 5. Post-Deployment Verification Checklist

- [ ] **Homepage & Navigation:** Verify public homepage loads at `https://aspen-glow.netlify.app/` with responsive luxury styling and Google Fonts.
- [ ] **SPA Direct Deep Linking:** Refresh browser directly on `/admin/login`, `/admin/festivals`, `/admin/posters`, and verify no 404 is thrown (handled by `_redirects`).
- [ ] **Admin Authentication:** Sign in with the administrator account at `/admin/login` and verify session persistence.
- [ ] **Poster Studio & Fabric Canvas:** Navigate to `/admin/posters`, test template switching, live canvas rendering, and PNG export.
- [ ] **Media & Storage Assets:** Verify that media library assets, poster portraits, and QR codes load properly over HTTPS.

