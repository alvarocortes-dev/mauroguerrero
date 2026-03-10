# Stack Research

**Domain:** Photography portfolio with block-based grid editor, image management, content protection, and admin dashboard
**Researched:** 2026-03-10
**Confidence:** HIGH (core stack verified; new library versions confirmed via npm)

---

## Context: What Already Exists

This is a **subsequent milestone** — not greenfield. The existing app runs:

- Next.js 16.1.6, React 19.2.3, TypeScript 5
- Drizzle ORM 0.45.1 + postgres 3.4.8
- Tailwind CSS 4, Framer Motion 12, Lucide React
- dnd-kit (core/sortable/modifiers), Zustand 5, Zod 4, Tiptap 3
- @aws-sdk/client-s3 3.982.0 + @aws-sdk/s3-request-presigner (already wired for R2)
- Supabase auth (being replaced), Cloudinary (being replaced)

**Do not reinstall what already exists.** The sections below cover only what needs to be added, migrated, or removed.

---

## Recommended Stack

### Authentication — Replace Supabase

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| better-auth | 1.5.4 | Drop-in self-hosted auth with 2FA | TypeScript-first, built-in TOTP plugin, Drizzle adapter, no external service, actively maintained (v1.5.4 published March 2026). Unlike Auth.js v5 which is still in perpetual beta, better-auth has stable semver releases. Single-user config is trivial. |
| otpauth | 9.5.0 | TOTP generation/verification | RFC-compliant (RFC 6238), actively maintained (last published 1 month ago, 63k weekly downloads), browser + Node support, zero external dependencies. Speakeasy is 7 years stale — do not use it. |
| qrcode.react | 4.2.0 | Render QR code for TOTP setup | React component wrapping qrcode.js; renders SVG QR codes for authenticator app enrollment (Google Authenticator, Authy, etc.). No server needed. |

**Why not Auth.js v5:** Still in perpetual beta after 3+ years; "stable enough" is community reassurance, not a release. better-auth ships semver stable tags, has first-class Drizzle support, and the 2FA plugin is built-in rather than bolted on.

**Why not Supabase:** Free tier suspends projects after inactivity. Photographer has been hacked before — suspension means locked out during attack.

---

### Image Storage — Replace Cloudinary

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @aws-sdk/client-s3 | 3.1006.0 | R2 upload, delete, list objects | Already in codebase. R2 is fully S3-compatible; just swap the endpoint to `https://<account-id>.r2.cloudflarestorage.com`. No new dependency needed. |
| @aws-sdk/s3-request-presigner | 3.1006.0 | Generate signed PUT URLs for client uploads | Already in codebase. Server generates presigned URL → client uploads directly to R2 → no image bytes pass through Next.js server. This pattern is critical for Vercel's 4.5MB body limit. |

**Why R2 over Cloudinary:** 10GB free storage, zero egress fees (Cloudinary charges per transformation and delivery). R2 is S3-compatible, so the SDK is already installed.

**Cloudinary removal:** Uninstall `cloudinary` package after migration. The `@aws-sdk` packages stay.

---

### Image Processing — New Addition

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| sharp | 0.34.5 | Resize, watermark, format conversion, thumbnail generation | Industry standard for Node.js image processing. Next.js officially recommends it for production image optimization. Handles JPEG/PNG/WebP/AVIF. Uses libvips (C library) — fastest option available. Must be server-side only. |
| exifr | 7.1.3 | EXIF metadata extraction (camera, lens, aperture, ISO, GPS) | Fastest JS EXIF library; jumps through file structure via pointers rather than reading bytes sequentially. Accepts Buffer input directly — works on upload stream before R2 write. Supports JPEG, HEIC, TIFF, WebP. 7.1.3 is current stable. |

**Why sharp over jimp/imagemagick:** sharp is 4-5x faster than jimp (uses C bindings, not pure JS). imagemagick requires system binary installation — not available on Vercel. sharp works on Vercel without configuration.

**Why exifr over ExifReader:** exifr is faster for partial reads (you don't need all tags), returns cleaner structured objects for photography metadata (GPS, camera settings), and has a smaller API surface for server use.

**Watermarking pattern with sharp:**
```ts
// Server-side on upload
const watermarked = await sharp(inputBuffer)
  .composite([{ input: watermarkSvgBuffer, gravity: 'southeast' }])
  .toBuffer();
```

---

### Grid Block Editor — Extend Existing dnd-kit

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @dnd-kit/core | 6.3.1 (existing) | Block drag & drop within grid | Already installed. Custom collision detection can implement grid-snapping behavior. Extending existing setup avoids bundle bloat. |
| @dnd-kit/utilities | 3.2.2 | CSS transform utilities for drag previews | Small companion to dnd-kit/core; provides `CSS.Transform.toString()` and related helpers. Needed for smooth drag overlay styling. |

**Why not react-grid-layout:** Adds its own CSS system that conflicts with Tailwind. Imposes a fixed pixel-based layout model (grid-item pixel width/height) — the project needs a column-span model (1x1, 2x1, 2x5), not pixel positions. dnd-kit + CSS grid `grid-column: span N` is the right primitive here.

**CSS grid span model:** Each block stores `{ colSpan: number, rowSpan: number, colStart: number, rowStart: number }`. The grid container uses `grid-template-columns: repeat(N, 1fr)` where N is the configurable column count. Tailwind's `col-span-*` utilities cover standard spans; custom spans use inline styles.

---

### Image Cropping — New Addition

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-image-crop | 11.0.10 | Client-side crop UI before upload | Zero dependencies, small (~5kb), renders crop overlay on a canvas. Crop happens in-browser before presigned URL upload — no server round-trip for crop data. Works with React 19. |

**Why not cropperjs:** CropperJS 2.x is a complete rewrite using web components; React bindings are unofficial third-party wrappers with lag behind upstream. react-image-crop is React-native and has 476 dependents.

---

### Content Protection — New Patterns (No New Libraries)

These are implementation patterns, not library choices:

| Concern | Implementation | Notes |
|---------|---------------|-------|
| Signed image URLs | `getSignedUrl()` from `@aws-sdk/s3-request-presigner` (already installed) | TTL 1h. Server generates signed URL on demand; client never sees permanent R2 URL. |
| Low-res display + high-res on request | Upload two variants via sharp (thumb 400px, full original) | Serve thumb always; full only through signed URL in lightbox after user interaction. |
| Right-click / drag disable | CSS `user-select: none`, `pointer-events: none` on overlay div | No library needed — pure CSS + React event handlers. |
| Invisible overlay | Absolute-positioned transparent div over each image | Intercepts click → opens lightbox instead of browser default. |
| DevTools detection | `window.outerWidth - window.innerWidth > 160` heuristic | Fires `visibilitychange` / hide content. Not reliable alone — combine with overlay + signed URLs. |
| Rate limiting on image endpoints | @upstash/ratelimit + @upstash/redis | See Anti-Scraping section below. |

---

### Anti-Scraping / Rate Limiting — New Addition

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @upstash/ratelimit | 2.0.8 | Sliding window rate limiting in Next.js middleware | Works in Vercel Edge Runtime (no cold start). Sliding window algorithm is appropriate for image endpoint abuse prevention. Free tier: 10k commands/day. |
| @upstash/redis | 1.36.4 | Redis client for Upstash (required by ratelimit) | Serverless Redis; no persistent connection needed. Pairs with ratelimit library. |

**Why Upstash over in-memory rate limiting:** Vercel is stateless; in-memory counters reset per function invocation. Upstash persists across requests. Free tier is sufficient for a single-photographer portfolio.

**Why not Arcjet:** Arcjet is more capable (bot detection, fingerprinting) but adds complexity and cost. For a portfolio, sliding-window rate limiting on image-serving routes is sufficient.

---

### Analytics — New Addition

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Cloudflare Web Analytics (script embed) | N/A (CDN script) | Page views, visitor counts, geographic data, referrers | Free forever, privacy-first, no cookies, no GDPR setup needed. One script tag in root layout. Already co-located with R2 in Cloudflare ecosystem. Data visible in Cloudflare dashboard. |

**Why not Umami self-hosted:** Umami requires a separate hosted database and Node.js process — additional infrastructure cost and maintenance for a free-tier project. Cloudflare Web Analytics is zero-infra.

**Why not Plausible:** Plausible self-hosting requires Docker + ClickHouse — significant RAM overhead. Plausible cloud costs $9/mo. Not justified for a single-photographer portfolio.

**Why not custom analytics table in Postgres:** Viable but requires custom dashboard UI, which is a significant build cost. Defer to a future phase if Cloudflare's built-in dashboard proves insufficient.

---

### Database — Keep Existing with Note on Provider

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Drizzle ORM | 0.45.1 (existing) | Schema definition, migrations, type-safe queries | Keep as-is. |
| postgres | 3.4.8 (existing) | PostgreSQL client | Keep as-is. |
| Neon (recommended provider) | N/A (service) | Serverless PostgreSQL hosting | Free tier: 0.5GB storage, 100 compute-hours/month. Vercel Postgres is literally Neon under the hood. No inactivity suspension. Better option than Turso (SQLite) since existing schema is Postgres-native. |

**Why not Turso:** Turso uses libSQL (SQLite fork). Migrating the existing PostgreSQL schema introduces friction for no meaningful benefit at this scale. Neon is the natural serverless Postgres choice for Vercel deployments.

---

## Packages to Remove

| Package | Replace With | Reason |
|---------|-------------|--------|
| `@supabase/supabase-js` | `better-auth` | Supabase free tier inactivity suspension |
| `@supabase/ssr` | `better-auth` + Next.js middleware | Supabase-specific SSR helpers no longer needed |
| `cloudinary` | `sharp` + R2 direct upload | Cloudinary replaced by R2 + local processing |

---

## Installation

```bash
# Authentication (replaces Supabase)
npm install better-auth otpauth qrcode.react

# Image processing (new — server-side only)
npm install sharp exifr

# Crop UI (client-side)
npm install react-image-crop

# dnd-kit utilities (supplements existing dnd-kit)
npm install @dnd-kit/utilities

# Rate limiting (anti-scraping)
npm install @upstash/ratelimit @upstash/redis

# Remove deprecated packages
npm uninstall @supabase/supabase-js @supabase/ssr cloudinary
```

**Note on sharp and Vercel:** sharp uses native binaries. Vercel automatically handles Linux x64 builds on deploy. No special config needed. Add `sharp` to `dependencies` (not devDependencies) so it deploys to production.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| better-auth | Auth.js v5 (next-auth) | If project already uses Auth.js v4 and needs minimal migration path — Auth.js v5 is stable enough in practice despite beta label |
| better-auth | lucia-auth | Lucia was deprecated by its author in December 2024 — do not use |
| otpauth | otplib | Both are valid; otplib is more TypeScript-oriented with a plugin system. Either works. |
| sharp | jimp | jimp when you need pure-JS (no native binaries) — e.g., edge runtime. Sharp is 4-5x faster on Node.js. |
| exifr | ExifReader | ExifReader when you need browser-side EXIF parsing. exifr is slightly faster on server for partial reads. |
| Cloudflare Web Analytics | Umami | Umami when you need raw event data, custom funnels, or SQL-level access to analytics. Requires self-hosting. |
| @upstash/ratelimit | Arcjet | Arcjet when you need bot fingerprinting and attack shield (DDoS, SQL injection detection). More power, more cost. |
| react-grid-layout | CSS grid + dnd-kit (custom) | react-grid-layout when you need pixel-perfect responsive breakpoints and don't care about Tailwind conflicts. For a controlled grid editor, custom is better. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `speakeasy` | Last updated 7 years ago, unmaintained | `otpauth` |
| `lucia-auth` | Deprecated by author December 2024 | `better-auth` |
| `jimp` for server watermarking | Pure JS, 4-5x slower than sharp, 10MB bundle | `sharp` |
| `imagemagick` (system binary) | Requires system binary — unavailable on Vercel | `sharp` |
| `react-grid-layout` | Pixel-based model conflicts with Tailwind; its own CSS system overrides grid | CSS grid + dnd-kit + Tailwind `col-span-*` |
| `Plausible` or `Umami` self-hosted | Require Docker/server — incompatible with free-tier constraint | Cloudflare Web Analytics (free, zero-infra) |
| In-memory rate limiting | Resets per Vercel function invocation — stateless, useless for rate limiting | `@upstash/ratelimit` |
| Supabase Auth | Free tier suspends on inactivity; single point of failure for a hacked-before user | `better-auth` |

---

## Stack Patterns by Concern

**Image upload flow (new pattern):**
1. Client picks file → shows `react-image-crop` UI
2. Client POSTs crop dimensions to `/api/upload/presign`
3. Server validates, calls R2 presigner, returns signed PUT URL (TTL 5 min)
4. Client PUTs file directly to R2 (bypasses Next.js body limit)
5. Client POSTs R2 key to `/api/upload/finalize`
6. Server: reads R2 object → sharp resize (thumb + full) → exifr extract → write DB → delete original raw
7. Server returns photo record with IDs, not URLs

**Image serving flow (protection pattern):**
1. Public page renders `<img src="/api/photo/[id]" />` — opaque API URL, never raw R2
2. `/api/photo/[id]` verifies session/auth if needed, calls `getSignedUrl()` with 1h TTL, 302 redirects to signed R2 URL
3. Signed URL contains R2 hostname; scraper gets URLs that expire in 1 hour

**2FA enrollment flow:**
1. Admin logs in with email + password
2. `better-auth` 2FA plugin checks if TOTP enabled → if yes, prompts for TOTP code
3. Enrollment: server generates TOTP secret → `otpauth` creates `otpauth://` URI → `qrcode.react` renders QR → user scans with authenticator app → user enters first code to confirm enrollment

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `better-auth@1.5.4` | Next.js 16, React 19, Drizzle ORM 0.45 | Drizzle adapter officially supported. Uses Drizzle push for schema sync. |
| `sharp@0.34.5` | Node.js >=18.17.0, Vercel Edge not supported | Must run in Node.js runtime (not Edge runtime). Mark image processing routes with `export const runtime = 'nodejs'`. |
| `exifr@7.1.3` | Node.js + Browser | Works with Buffer input from multipart form or S3 GetObject. |
| `react-image-crop@11.0.10` | React 18+, React 19 confirmed | Client component only. |
| `@upstash/ratelimit@2.0.8` | Vercel Edge Runtime, Node.js | Works in middleware.ts (Edge). |

---

## Sources

- `npm show better-auth version` → 1.5.4 (verified 2026-03-10) — HIGH confidence
- `npm show sharp version` → 0.34.5 (verified 2026-03-10) — HIGH confidence
- `npm show exifr version` → 7.1.3 (verified 2026-03-10) — HIGH confidence
- `npm show otpauth version` → 9.5.0 (verified 2026-03-10) — HIGH confidence
- `npm show react-image-crop version` → 11.0.10 (verified 2026-03-10) — HIGH confidence
- `npm show @upstash/ratelimit version` → 2.0.8 (verified 2026-03-10) — HIGH confidence
- [Cloudflare R2 Presigned URLs docs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) — S3-compatible presigned URL support confirmed — HIGH confidence
- [Auth.js v5 perpetual beta discussion](https://github.com/nextauthjs/next-auth/discussions/13382) — v5 still beta as of March 2026 — HIGH confidence
- [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next) — Native Next.js support confirmed — HIGH confidence
- [sharp Next.js docs](https://nextjs.org/docs/messages/install-sharp) — Vercel production deployment confirmed — HIGH confidence
- [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/about/) — Free, script embed, no infrastructure — HIGH confidence
- [Upstash Ratelimit for Next.js Edge](https://upstash.com/blog/edge-rate-limiting) — Works in Vercel Edge Middleware — MEDIUM confidence (blog, not official docs)
- [exifr GitHub](https://github.com/MikeKovarik/exifr) — Buffer input support confirmed — HIGH confidence

---
*Stack research for: Photography portfolio with block grid editor, R2 storage, self-hosted auth, image protection*
*Researched: 2026-03-10*
