# Project Research Summary

**Project:** Mauro Guerrero Photography Portfolio
**Domain:** Single-photographer portfolio with block-based grid editor, image management, self-hosted auth, and content protection
**Researched:** 2026-03-10
**Confidence:** HIGH

## Executive Summary

This is a subsequent milestone on an existing Next.js 16 / React 19 / TypeScript / Drizzle ORM codebase — not a greenfield project. The existing app has the right foundation (dnd-kit, Zustand, Tiptap, Zod, AWS SDK already installed) but relies on two external services that must be replaced: Supabase Auth (suspends on inactivity, prior security concern) and Cloudinary (being replaced with Cloudflare R2, which is already wired in the AWS SDK). The core new capability is a block-based CSS grid editor where each block carries `colSpan` / `rowSpan` values — replacing the current masonry/layout-engine approach with native CSS Grid, which is the right primitive for this creative-control requirement.

The recommended approach prioritizes security migration first (auth + R2), then the image processing pipeline, then the grid editor, then the projects system, and finally public-facing polish. This order is dictated by hard dependencies: images cannot be placed in grid blocks until the upload pipeline and photo library exist; the photo library cannot exist without R2 being live; and the editor cannot safely ship until the auth layer is hardened. The photographer has been hacked before — two critical security pitfalls (middleware-only auth bypass via CVE-2025-29927, and plaintext TOTP secret storage) must be addressed before 2FA is enabled, not after.

The most significant risk is false security: CSS right-click blocking and overlays are trivially bypassed. Real protection requires a private R2 bucket, server-side watermarks burned into images via Sharp on upload, and signed expiring URLs — all of which require the upload pipeline to be built correctly from the start. A second major risk is the dnd-kit variable-size block collision detection problem (confirmed open GitHub issues): using default `closestCenter` collision detection on a grid with mixed-span blocks will corrupt layout state. A custom occupancy-matrix approach is required and must be designed in from day one, not retrofitted.

---

## Key Findings

### Recommended Stack

The existing stack is strong and requires minimal additions. The core changes are replacements (Supabase → better-auth, Cloudinary → R2 direct upload) plus new additions for image processing (sharp, exifr) and anti-scraping (Upstash ratelimit). All recommended library versions were verified against npm on 2026-03-10.

**Core technologies — new or changed:**
- **better-auth 1.5.4**: Replaces Supabase auth — TypeScript-first, stable semver, built-in TOTP plugin, Drizzle adapter. Auth.js v5 is still in perpetual beta; lucia-auth was deprecated December 2024.
- **sharp 0.34.5**: Server-side image processing (resize, watermark composite, WebP conversion) — 4–5x faster than jimp, Vercel-compatible, officially recommended by Next.js. Must be in Node.js runtime, not Edge.
- **exifr 7.1.3**: EXIF extraction before Sharp strips metadata on re-encode. Must run on the raw buffer before processing.
- **@upstash/ratelimit 2.0.8 + @upstash/redis 1.36.4**: Sliding-window rate limiting on image endpoints via Vercel Edge. In-memory rate limiting is useless on stateless Vercel functions.
- **Cloudflare R2 via existing @aws-sdk**: Zero egress fees, S3-compatible, SDK already installed. Swap endpoint to `https://<account-id>.r2.cloudflarestorage.com`.
- **Cloudflare Web Analytics**: Free, zero-infra, no cookies, no GDPR setup — script tag in root layout.
- **react-image-crop 11.0.10**: Client-side crop UI (P2 feature, v1.x).

**Remove:** `@supabase/supabase-js`, `@supabase/ssr`, `cloudinary`.

### Expected Features

The feature set has clear P1 / P2 / P3 tiers based on dependencies. Everything in P1 must ship together because users cannot meaningfully evaluate the portfolio otherwise.

**Must have (P1 — table stakes + core differentiators):**
- Block grid editor with configurable columns and col/row spans (1x1, 2x1, 2x5, etc.) — the central creative tool
- Projects system with create/edit/delete and directory navigation
- Multi-upload pipeline with Sharp processing (resize, watermark, EXIF extraction)
- Photo library (internal media manager) — required before any block can hold an image
- Lightbox with keyboard navigation — universal expectation
- better-auth credentials + TOTP 2FA — non-negotiable given prior hack
- Cloudflare R2 storage migration — Supabase suspension forces this
- Basic content protection: right-click disable, drag disable, CSS overlay, low-res display, signed R2 URLs

**Should have (P2 — add after P1 validated):**
- EXIF display panel in lightbox
- Crop tool in upload flow
- Cloudflare Worker proxy for custom-domain signed URL serving
- Analytics dashboard (Cloudflare Web Analytics gives baseline immediately)
- DevTools detection with content dimming

**Defer (v2+):**
- Advanced watermark configurator (position, opacity, text vs. image)
- Bulk photo re-processing
- Geographic analytics beyond Cloudflare free tier
- AI auto-tagging

**Anti-features (do not build):** screenshot blocking (technically impossible), client proofing gallery, e-commerce/print sales, native video hosting, real-time collaborative editing.

### Architecture Approach

The architecture is a standard Next.js App Router setup with route groups: `(site)` for public SSR pages and `(editor)` for protected admin pages. The key structural decision is that images are stored in a library-first model: an `images` table in PostgreSQL stores metadata + R2 key prefix; blocks reference `imageId`, never direct URLs. This decouples layout data from storage URLs, making CDN migrations safe. The grid uses native CSS Grid with `grid-column: span N` / `grid-row: span N` — no JavaScript layout engine. The existing layout-engine module should be deleted.

**Major components:**
1. **Image Pipeline** (`lib/pipeline/`) — Sharp on upload: extract EXIF → resize three variants (thumb 400px, medium 1200px, full 2400px) → composite watermark → convert to WebP → upload to R2. Runs synchronously in the API route (fine for single-user, low-frequency uploads).
2. **Block Grid Canvas + GridRenderer** — CSS Grid container with `columns` from layout data; each block uses `grid-column: span N`. BlockCanvas handles dnd-kit drag/resize; GridRenderer is the shared component used in both editor and public site (same component, preventing render mismatch).
3. **Auth Layer** (`lib/auth/`) — better-auth credentials provider + TOTP plugin. Middleware is the first gate; every API route and Server Component independently calls `auth()`. Never trust middleware alone (CVE-2025-29927).
4. **Content Protection Layer** (`lib/protection/`) — signed URL proxy (`/api/images/[id]` generates 15-minute presigned R2 URLs, 302 redirects), CSS guards, devtools detection.
5. **Zustand EditorStore** — single source of truth for editor state. Undo/redo via `zundo` temporal middleware; snapshot only on discrete actions (drag end, resize release, blur), capped at 50 entries.

**Data model additions:** `projects` table (FK → layouts), `images` table (photo library with EXIF JSON), `users` table (replaces Supabase, stores encrypted TOTP secret), `analytics_events` table. Extend `layouts` with `columns` and `gap` columns.

### Critical Pitfalls

1. **Middleware-only auth (CVE-2025-29927)** — A single spoofed `x-middleware-subrequest` header bypasses all Next.js middleware, including 2FA. Prevention: pin Next.js ≥15.2.3, add `auth()` server-side checks inside every protected route handler, block the header at Cloudflare WAF. Must be fixed before 2FA creates a false sense of security.

2. **TOTP secret stored plaintext** — If the database is read (SQL injection, leaked backup), every 2FA secret is immediately usable — critical for a photographer who has been hacked. Prevention: AES-256-GCM encrypt before inserting; store IV alongside; rate-limit TOTP verify endpoint to 5 attempts/minute.

3. **File upload through Vercel serverless body (4.5 MB limit)** — Any code path that POSTs a file to a Next.js API route and forwards it to R2 will fail silently for files over 4.5 MB. Prevention: presigned PUT URL flow — API route generates URL, browser uploads directly to R2, API route receives completion callback and triggers processing.

4. **dnd-kit default collision detection on variable-size blocks** — `closestCenter` / `closestCorners` assume uniform item sizes. Mixed `colSpan`/`rowSpan` blocks produce wrong drop targets and layout corruption (confirmed dnd-kit issues #720, #813, #1605). Prevention: implement a custom collision detection algorithm using an occupancy matrix (2D array of block IDs). Must be designed in from day one — retrofitting is expensive.

5. **CSS-only content protection is not protection** — `pointer-events: none`, overlay divs, and right-click blocks are bypassed in 60 seconds via DevTools. Prevention: the real defense is (a) serving only medium-res variants publicly, (b) watermarks burned into files by Sharp on upload (not CSS), and (c) private R2 bucket with signed URLs. CSS deterrents are supplementary, not primary.

---

## Implications for Roadmap

Based on research, the dependency chain is unambiguous: auth and storage must be migrated before the upload pipeline can be built; the upload pipeline must exist before the photo library; the photo library must exist before the grid editor is useful; the projects system builds on top of a stable grid editor; content protection layers on top of all of the above.

### Phase 1: Foundation — Auth + Storage Migration

**Rationale:** Everything else depends on reliable auth (no Supabase suspension) and working R2 storage. This phase eliminates the two external-service dependencies. It is also where the two most critical security pitfalls live — CVE-2025-29927 and plaintext TOTP secrets — which must be resolved before 2FA adds a false sense of security.

**Delivers:** better-auth credentials + TOTP 2FA replacing Supabase; R2 client utilities + presigned URL generation; DB schema migration (extend layouts, add projects/images/users tables); Next.js ≥15.2.3 upgrade; Cloudflare WAF rule blocking `x-middleware-subrequest`.

**Features addressed:** Secure admin login (TOTP 2FA), R2 storage migration.

**Pitfalls to avoid:** Middleware-only auth (CVE-2025-29927), plaintext TOTP secret storage, R2 CORS misconfiguration (configure via Wrangler CLI, not dashboard).

### Phase 2: Image Pipeline + Photo Library

**Rationale:** Blocks cannot hold images until photos are uploaded, processed, and catalogued. This phase builds the ingest pipeline that all subsequent editor work depends on.

**Delivers:** Sharp pipeline (EXIF extract → resize three variants → watermark → WebP → R2); presigned PUT URL upload flow (bypasses Vercel 4.5 MB limit); `/api/images/[id]` signed URL proxy; photo library UI in admin; R2 private bucket confirmed.

**Features addressed:** Multi-upload pipeline, photo library (media manager), EXIF extraction at ingest, visible watermarks burned into files.

**Pitfalls to avoid:** Synchronous upload through Vercel serverless (use presigned URL flow), Sharp binary mismatch on Vercel (must be Linux x64 build), EXIF extraction must happen before Sharp re-encodes (strips EXIF), loading full-res images in editor previews (use thumb variant).

### Phase 3: Block Grid Editor

**Rationale:** With images in the library and auth stable, the grid editor is buildable. This is the highest-complexity phase (custom collision detection, occupancy matrix, undo/redo infrastructure). It must be built before the projects system, which depends on a working per-project grid.

**Delivers:** GridRenderer (shared between editor and public site — single component), BlockCanvas + BlockItem with colSpan/rowSpan support, dnd-kit custom collision detection with occupancy matrix, resize handles, Zustand EditorStore with zundo undo/redo (capped, discrete snapshots), photo library drag-into-block, column count control in toolbar.

**Features addressed:** Block grid editor with configurable columns and col/row spans, photo library integration, editor preview parity with public site.

**Pitfalls to avoid:** dnd-kit default collision detection on variable-size blocks (must use occupancy matrix from the start), unbounded undo/redo history (cap at 50, snapshot only on discrete actions), editor/public render mismatch (shared GridRenderer component), Zustand subscriptions on every cell (use subscribeWithSelector), Framer Motion layout animations during drag (disable during drag, restore on drop), unsaved-changes navigation loss.

### Phase 4: Projects System + Public Site

**Rationale:** With the grid editor stable, per-project layouts are a straightforward extension. Public pages complete the visitor-facing experience.

**Delivers:** Projects DB CRUD + API routes, project directory navigation (expandable sidebar), per-project grid editor page, public `/projects/[slug]` pages, lightbox with keyboard navigation and ARIA, homepage grid updated to new GridRenderer.

**Features addressed:** Projects system, directory navigation, public project pages, lightbox viewer, mobile-responsive layout.

**Pitfalls to avoid:** Editor/public render mismatch (already solved in Phase 3 with shared component), lightbox keyboard nav not announced to screen readers (aria-label, role="dialog", aria-live).

### Phase 5: Content Protection + Polish

**Rationale:** Protection layers (JS guards, DevTools detection, full signed URL architecture) are best added last, after the image serving and public rendering are stable. Adding them early creates noise before the core is solid.

**Delivers:** JS guards (right-click, drag, selection disable), DevTools detection with content dimming, Cloudflare Worker proxy for custom-domain signed URLs (P2), EXIF display in lightbox (P2), Cloudflare Web Analytics script embed, site management from admin (bio, contact).

**Features addressed:** Content protection layer, DevTools detection, EXIF display in lightbox, analytics.

**Pitfalls to avoid:** CSS-only protection (watermarks and private R2 bucket are the real defense — already done in Phase 2), public R2 URLs in page source (verify signed URL proxy is working before shipping), watermark as CSS overlay (already avoided by burning into file in Phase 2).

### Phase Ordering Rationale

- **Auth before everything:** Supabase inactivity suspension is a live operational problem. Every subsequent feature needs protected routes.
- **R2 + pipeline before editor:** Blocks need images; images need a pipeline; the pipeline needs R2 CORS working and verified.
- **Custom collision detection in Phase 3, not Phase 4:** Retrofitting grid coordinate logic after the editor is feature-complete is a major rewrite. Build it correctly once.
- **Projects after editor:** Per-project grids are instances of the grid editor; the editor must be stable first.
- **Protection last (except watermarks):** Watermarks and private bucket are in Phase 2 (ingest-time decisions). JS/CSS deterrents and the Cloudflare Worker proxy are polish layers that don't block core functionality.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Grid Editor):** Custom dnd-kit collision detection for variable-size CSS Grid blocks is under-documented; the occupancy matrix approach needs prototyping before full implementation. Consider a spike in planning.
- **Phase 5 (Cloudflare Worker proxy):** Wiring a Cloudflare Worker as a proxy in front of R2 for custom-domain signed URL serving is technically detailed; confirm the specific Worker binding pattern for the account setup before committing to a sprint.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Auth + Storage):** better-auth + Drizzle adapter is well-documented; R2 presigned URL generation is official Cloudflare docs; straightforward migration.
- **Phase 2 (Image Pipeline):** Sharp + R2 upload via presigned URL is a well-established pattern with official sources.
- **Phase 4 (Projects + Public Site):** Standard Next.js App Router CRUD + SSR pages; no novel patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All library versions verified via npm on 2026-03-10; official docs confirmed for R2, better-auth, sharp. One MEDIUM source: Upstash ratelimit Edge blog post, not official docs — but the pattern is widely confirmed. |
| Features | MEDIUM-HIGH | Core features HIGH (photography portfolio conventions well-established). Protection nuances MEDIUM — signed URL custom-domain requirement via Cloudflare Worker is confirmed in community sources, not official docs. |
| Architecture | HIGH | Existing codebase analyzed; patterns verified against current library docs. Build order derived from hard dependency chain, not opinion. |
| Pitfalls | HIGH | CVE-2025-29927 verified against three independent security research sources. dnd-kit collision issues confirmed in tracked GitHub issues. Vercel 4.5 MB limit from official Vercel docs. TOTP encryption from security best-practice references. |

**Overall confidence:** HIGH

### Gaps to Address

- **Cloudflare Worker proxy for signed URL serving (Phase 5):** The pattern of using a Worker in front of R2 for custom-domain access control is confirmed conceptually, but the specific Worker binding syntax for this account's R2 setup needs validation during Phase 5 planning. Community tutorial exists; official binding docs should be cross-referenced.
- **better-auth TOTP encryption at rest:** better-auth's built-in TOTP plugin stores the secret in the DB column it manages. Confirm whether the plugin supports an encryption hook before the auth migration starts, or whether the encryption wrapper must be applied at the Drizzle layer manually.
- **Sharp binary on Vercel with Next.js 16:** Sharp 0.34.5 with Vercel is confirmed working, but with Next.js 16 (released late 2025), confirm `serverComponentsExternalPackages` or equivalent config to prevent Sharp native bindings from being bundled incorrectly.

---

## Sources

### Primary (HIGH confidence)

- `npm show better-auth version` → 1.5.4 (verified 2026-03-10)
- `npm show sharp version` → 0.34.5 (verified 2026-03-10)
- `npm show exifr version` → 7.1.3 (verified 2026-03-10)
- `npm show otpauth version` → 9.5.0 (verified 2026-03-10)
- `npm show react-image-crop version` → 11.0.10 (verified 2026-03-10)
- `npm show @upstash/ratelimit version` → 2.0.8 (verified 2026-03-10)
- [Cloudflare R2 Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Cloudflare R2 CORS Official Docs](https://developers.cloudflare.com/r2/buckets/cors/)
- [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next)
- [sharp Vercel deployment](https://nextjs.org/docs/messages/install-sharp)
- [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/about/)
- CVE-2025-29927: [ProjectDiscovery](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass), [Datadog Security Labs](https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/), [Akamai](https://www.akamai.com/blog/security-research/march-authorization-bypass-critical-nextjs-detections-mitigations)
- dnd-kit collision issues: [GitHub #720](https://github.com/clauderic/dnd-kit/issues/720), [GitHub #813](https://github.com/clauderic/dnd-kit/issues/813), [GitHub #1605](https://github.com/clauderic/dnd-kit/discussions/1605)
- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations)

### Secondary (MEDIUM confidence)

- [Upstash Ratelimit for Next.js Edge](https://upstash.com/blog/edge-rate-limiting) — Edge middleware rate limiting pattern
- [Auth.js 2FA example](https://github.com/bharathvaj-ganesan/next-auth-2fa-example) — TOTP session state pattern
- [Cloudflare Worker R2 proxy](https://blog.dankying.com/en/posts/20250429-how-to-build-an-image-service-using-cloudflare-workers/) — Custom-domain signed URL serving
- [exifr GitHub](https://github.com/MikeKovarik/exifr) — Buffer input, partial reads

### Tertiary (LOW confidence)

- None — no findings depend on single unverified sources.

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
