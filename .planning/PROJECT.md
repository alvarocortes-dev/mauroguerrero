# Mauro Guerrero — Photography Portfolio

## What This Is

A professional photography portfolio website for a single photographer (Mauro Guerrero). The site has two faces: a public portfolio with a masonry grid homepage and project galleries, and a powerful admin system where the photographer builds layouts by dragging configurable blocks into grids. Content protection is critical — the photographer has been hacked before and needs maximum security for both access and image assets.

## Core Value

The photographer can independently build and manage beautiful, custom-layout galleries with full creative control — fast, intuitive, and protected.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Inferred from existing codebase. -->

- ✓ Next.js app with route groups (site/editor) — existing
- ✓ Basic masonry grid renderer with Framer Motion animations — existing
- ✓ Editor with Zustand store (add, remove, move, update items) — existing
- ✓ Layout item types: image, text, spacer — existing
- ✓ Drag & drop reordering via dnd-kit — existing
- ✓ Supabase auth with middleware protecting /editor routes — existing
- ✓ Image upload to Cloudinary with server-side signature — existing
- ✓ PostgreSQL database via Drizzle ORM — existing
- ✓ API routes for layout CRUD and image upload — existing
- ✓ Sidebar navigation with sections: Sobre mí, Proyectos, Contacto, Créditos — existing
- ✓ Rich text editing via Tiptap — existing

### Active

<!-- Current scope. Building toward these. -->

**Grid Editor (core)**
- [ ] Configurable column count per layout (e.g., 5 columns)
- [ ] Block-based grid system with sizes (1x1, 2x1, 1x3, 2x5, etc.)
- [ ] Block types: image, video embed, text, empty/spacer
- [ ] Drag & drop blocks to build layouts
- [ ] Resize, reposition, and align blocks within grid

**Projects System**
- [ ] Create/edit/delete projects, each with its own grid layout
- [ ] Directory-style navigation in menu (click Proyectos → expandable tree)
- [ ] Project ordering controlled by photographer
- [ ] Categories/groupings for organizing projects

**Photo Management**
- [ ] Multi-file upload with drag & drop and file picker
- [ ] Automatic resize to multiple sizes (thumbnail, medium, full)
- [ ] Crop/recorte tool before publishing
- [ ] Automatic watermark application (configurable)
- [ ] EXIF metadata extraction and storage (camera, lens, aperture, ISO, etc.)
- [ ] Internal photo gallery/library for managing all uploaded photos
- [ ] Migrate storage from Cloudinary to Cloudflare R2

**Lightbox / Photo Viewer**
- [ ] Click any photo to open full-resolution modal with background blur
- [ ] Left/right arrow navigation between consecutive photos
- [ ] Optional EXIF metadata display panel within lightbox
- [ ] Keyboard navigation support

**Content Protection (maximum)**
- [ ] Visible watermark overlay on photos
- [ ] Disable right-click context menu on images
- [ ] Disable image dragging
- [ ] CSS anti-selection on image elements
- [ ] Invisible overlay layer on top of images
- [ ] Low-resolution display with high-res only via signed/temporary URLs
- [ ] DevTools detection with content hiding
- [ ] URL obfuscation — never expose direct image links
- [ ] Anti-scraping measures (rate limiting, bot detection)

**Authentication & Security**
- [ ] Replace Supabase auth with self-hosted solution (no inactivity suspension)
- [ ] Two-factor authentication (TOTP/authenticator app)
- [ ] Single-user admin access

**Analytics**
- [ ] Visit tracking dashboard (origin, page views, dates)
- [ ] Cloudflare analytics integration if feasible
- [ ] Basic geographic/referrer data

**Site Management**
- [ ] Edit contact links and info from admin
- [ ] Edit profile photo and bio from admin
- [ ] Edit credits page content from admin

**Performance**
- [ ] Fast image loading with lazy loading and progressive enhancement
- [ ] Optimized for older hardware (iMac) and modern devices
- [ ] High-quality image display

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Native video hosting/upload — use YouTube/Vimeo embeds instead (storage costs)
- Multi-user admin — single photographer, single admin account
- E-commerce / photo sales — not a commerce platform
- Blog / article system — portfolio-only focus
- Mobile app — web-only, responsive design
- Real-time collaboration — single user editing
- Social features (comments, likes) — portfolio showcase, not social media
- Email newsletter — not needed for portfolio

## Context

**Existing codebase:** Next.js 16 app with React 19, Tailwind CSS 4, Drizzle ORM, Zustand state management. Has a working editor prototype with basic masonry grid, item management, and Cloudinary uploads. Auth via Supabase middleware.

**Migration needed:** Supabase suspends free-tier projects on inactivity — must migrate auth to a self-hosted solution. Cloudinary → Cloudflare R2 for storage (free egress, 10GB free). Both AWS S3 SDK (R2-compatible) and Cloudinary SDK currently in codebase.

**Security concern:** The photographer has been hacked before. Auth security (2FA) and content protection are non-negotiable priorities.

**Target user:** Professional photographer working on hardware ranging from older iMac to modern setups. Admin UX must be fast, intuitive, and performant across devices.

**Budget constraint:** Must stay on free tiers for all services. Site must perform professionally despite zero infrastructure cost.

## Constraints

- **Budget**: Free tier only — Cloudflare R2, Turso/Neon PostgreSQL, Vercel hosting
- **Storage**: Cloudflare R2 (10GB free/month, no egress fees)
- **Auth**: No Supabase — self-hosted auth (NextAuth/Auth.js with credentials + TOTP)
- **Performance**: Must work well on older iMac hardware — avoid heavy client-side computation
- **Tech stack**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Drizzle ORM (keep existing)
- **Single user**: One photographer, one admin — no multi-tenancy complexity

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cloudflare R2 for storage | Free egress, S3-compatible, no inactivity suspension | — Pending |
| Self-hosted auth (not Supabase) | Free tier suspends on inactivity; photographer was hacked before | — Pending |
| Block-based grid editor (not free canvas) | Masonry with configurable blocks balances flexibility and build complexity | — Pending |
| Video as embeds only | Avoids storage costs and processing complexity | — Pending |
| EXIF extraction server-side on upload | Store once, display anywhere; keeps client lightweight | — Pending |

---
*Last updated: 2026-03-10 after initialization*
