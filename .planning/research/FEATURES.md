# Feature Research

**Domain:** Single-photographer portfolio with block-based grid editor and image management admin
**Researched:** 2026-03-10
**Confidence:** MEDIUM-HIGH (core features HIGH, protection nuances MEDIUM)

---

## Feature Landscape

### Table Stakes (Users Expect These)

These are non-negotiable for the portfolio to feel complete and professional. The "user" here is dual: the public visitor and the photographer-admin.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Responsive grid gallery on homepage | Every professional portfolio has this; absence signals amateur | LOW | Already exists as masonry grid; needs column/block-size upgrade |
| Project pages with dedicated galleries | Visitors expect to browse by project/series | MEDIUM | Core of the new milestone |
| Lightbox / photo viewer | Clicking a photo and having it expand is universal expectation | MEDIUM | Arrow nav, keyboard, close on backdrop click |
| About page with bio and photo | First thing clients look for after portfolio | LOW | Admin-editable bio + profile photo |
| Contact section | Required for any professional's site | LOW | Already has ContactForm component |
| Image upload from admin | Without this the photographer cannot manage content independently | MEDIUM | Exists via Cloudinary; migrating to R2 |
| Secure admin login | Single-user admin must be inaccessible to attackers | MEDIUM | Already has Supabase auth; migrating to Auth.js + TOTP |
| Fast image loading | Slow images = visitors leave; Google penalizes slow sites | MEDIUM | Lazy loading, progressive JPEG, proper sizing |
| Mobile-responsive layout | >50% of portfolio visitors browse on mobile | MEDIUM | Tailwind responsive utilities; test on actual devices |
| Sidebar/navigation with project listing | Visitors need to explore; no nav = dead end | LOW | Already partially exists |

### Differentiators (Competitive Advantage)

Features that make this portfolio stand out and serve the photographer's specific creative and security needs.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Block-based grid editor with configurable columns and sizes (1x1, 2x1, 2x5, etc.) | Photographer has full creative control over layout rhythm; competitors offer only uniform grids | HIGH | CSS grid with col-span / row-span; dnd-kit already in codebase; biggest build investment |
| EXIF metadata display in lightbox | Conveys craft and technical depth; fellow photographers and serious clients appreciate it | MEDIUM | Extract server-side on upload with sharp; store in DB; display optionally in lightbox panel |
| Visible watermark on all displayed images | Deters opportunistic theft; brand reinforcement on every image | MEDIUM | Applied server-side during upload pipeline with sharp; configurable position/opacity |
| Signed / time-limited URLs for image serving | Images can't be hot-linked or scraped by saving raw URL; forces each request through app | HIGH | Cloudflare R2 presigned URLs; requires Cloudflare Worker proxy to use with custom domain |
| Multi-upload with drag-and-drop and batch processing | Dramatically reduces friction for adding photos; bulk resize/watermark on upload | MEDIUM | sharp for server-side processing; React dropzone on client |
| Internal photo library (media manager) | Centralized view of all uploaded photos, reusable across layouts and projects | MEDIUM | DB-backed photo list; searchable/filterable by project or date |
| TOTP two-factor authentication | Non-negotiable given prior hack; standard authenticator-app flow (Google Authenticator, etc.) | MEDIUM | otplib + qrcode; custom credential flow in Auth.js; QR code setup screen |
| Directory-style project navigation (expandable tree) | Organizes a large body of work; clients can drill into specific series | MEDIUM | Sidebar tree component; project ordering drag-and-drop in admin |
| Analytics dashboard (page views, origins, referrers) | Photographer can see what's resonating, where traffic comes from | MEDIUM | Cloudflare Web Analytics free tier covers most needs; supplement with custom DB logging if needed |
| DevTools detection with content dimming | Raises the cost of scraping for non-technical attackers; pairs with other protections | LOW | Viewport-size change detection; reasonable deterrent, not a wall |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Screenshot / screen-capture blocking | Complete protection instinct; "block everything" | Technically impossible at browser level; creates hostile UX for legitimate visitors; CSS `user-select: none` and overlay divs only stop casual actions | Combine watermark + low-res display + legal copyright notice; accept that screenshots exist |
| 100% DevTools block (hard block, crash browser) | Deters advanced scrapers | Determined user can always bypass; known bypass scripts exist publicly; aggressive detection breaks accessibility tools and extension users | Soft detection (dim content + warning banner) rather than hard block |
| Client gallery / proofing system | Clients want to review and select photos | Multi-user access, sharing, commenting, download tracking — entire secondary product; out of scope | Not this portfolio; use a dedicated tool (Pixieset, Pic-Time) for client delivery |
| E-commerce / print sales | Monetization opportunity | Payment processing, fulfillment, tax handling — massive scope; doesn't fit portfolio-only focus | Redirect interested buyers to external print-on-demand service |
| Native video upload and hosting | Rich portfolio, shows motion work | Storage costs prohibitive on free tier; video transcoding is a separate engineering problem | Embed YouTube / Vimeo; video-as-embed block type in editor |
| Real-time collaborative editing | Feels modern | Single user only; real-time sync adds infrastructure complexity (websockets / CRDT) for zero benefit | Single-user optimistic updates via SWR/React Query are sufficient |
| AI auto-tagging or smart search | Discoverability | Adds external API cost and complexity; portfolio has limited images, not a stock library | Manual tags on upload if needed; defer to future |
| Comment / guestbook system | Engagement | Requires moderation; spam; off-brand for professional portfolio | Contact form is sufficient |

---

## Feature Dependencies

```
[Block Grid Editor]
    └──requires──> [Projects System] (each project has a grid)
    └──requires──> [Photo Library] (images must exist before placing in grid)
                       └──requires──> [Multi-Upload Pipeline]
                                          └──requires──> [R2 Storage Integration]
                                          └──enhances──> [EXIF Extraction] (extract on ingest)
                                          └──enhances──> [Watermark Pipeline] (apply on ingest)

[Lightbox Viewer]
    └──requires──> [Photo in Grid] (grid placement triggers lightbox)
    └──enhances──> [EXIF Display] (optional panel inside lightbox)

[Signed URL Serving]
    └──requires──> [R2 Storage Integration]
    └──requires──> [Cloudflare Worker Proxy] (presigned URLs expose raw R2 endpoint without worker)
    └──conflicts──> [Open / public bucket URLs] (can't use both strategies simultaneously)

[Content Protection Layer]
    └──enhances──> [Signed URL Serving] (URL obfuscation)
    └──enhances──> [Watermark Pipeline] (visible deterrent)
    └──conflicts──> [Right-click on non-image elements] (CSS `pointer-events: none` overlay blocks legitimate interactions if applied globally)

[TOTP 2FA]
    └──requires──> [Auth.js Credentials Provider] (2FA bolted onto credential flow)
    └──requires──> [TOTP secret storage in DB] (per-user secret)

[Analytics Dashboard]
    └──independent──> all other features (can be added at any phase)
    └──enhances──> [Cloudflare DNS/CDN] (Cloudflare Web Analytics free if already on Cloudflare)

[Projects Directory Navigation]
    └──requires──> [Projects System]
    └──enhances──> [Block Grid Editor] (navigation leads to project grids)
```

### Dependency Notes

- **Block Grid Editor requires Photo Library:** Placing an image block requires images to already exist in a managed library, not just be ad-hoc uploaded inline. Build the library and upload pipeline first.
- **Signed URLs require Cloudflare Worker Proxy:** R2 presigned URLs use the native `*.r2.cloudflarestorage.com` endpoint. To serve from a custom domain while maintaining access control, a thin Cloudflare Worker must sit in front. Without this, either security is weaker (public bucket) or URLs expose the raw R2 endpoint.
- **Watermark conflicts with crop:** The crop tool must run before watermarking. Pipeline order matters: upload → EXIF extract → crop (optional, user-triggered) → resize → watermark → store to R2.
- **EXIF extraction is ingest-time only:** EXIF data is stripped when sharp re-encodes the image. Extract before processing; store to DB. Attempting to extract post-processing returns empty.
- **DevTools detection conflicts with accessibility tools:** Screen readers and browser extensions use DevTools protocols. A hard block breaks these users. Soft detection (content dimming + message) is the safe upper bound.

---

## MVP Definition

This is a subsequent milestone on an existing site. "MVP" here means the minimum to make the new milestone functional and shippable.

### Launch With (v1 of this milestone)

- [ ] **Block grid editor with configurable columns and col/row spans** — core creative tool; everything else builds on this
- [ ] **Projects system with create/edit/delete and directory navigation** — portfolio is useless without organized projects
- [ ] **Multi-upload pipeline with sharp processing (resize, watermark, EXIF extract)** — photographer must be able to add work independently
- [ ] **Photo library (internal media manager)** — required to populate grids; reuse images across projects
- [ ] **Lightbox with keyboard navigation** — standard expectation; missing = incomplete
- [ ] **Auth.js credentials + TOTP 2FA** — non-negotiable given prior hack; replaces Supabase auth
- [ ] **Cloudflare R2 storage migration** — Supabase suspension forces this; unblocks auth migration
- [ ] **Basic content protection layer** — right-click disable, drag disable, CSS overlay, low-res display; signed URLs via R2

### Add After Validation (v1.x)

- [ ] **EXIF display panel in lightbox** — adds depth; depends on extraction working reliably in v1
- [ ] **Crop tool in upload flow** — UX polish; v1 can rely on pre-cropped uploads
- [ ] **Cloudflare Worker proxy for signed URL serving with custom domain** — security hardening; technically complex, defer until R2 baseline works
- [ ] **Analytics dashboard** — useful but not blocking; Cloudflare Web Analytics gives baseline immediately
- [ ] **DevTools detection with content dimming** — deterrent layer; add after core is stable

### Future Consideration (v2+)

- [ ] **Advanced watermark configurator** (position, opacity, text vs. image) — nice-to-have; v1 can use a fixed watermark config
- [ ] **Bulk photo re-processing** (re-watermark, re-resize existing library) — only needed if watermark design changes
- [ ] **Geographic analytics** — beyond Cloudflare's free tier; requires third-party or self-hosted solution
- [ ] **AI auto-tagging** — exploratory; depends on API cost tolerance

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Block grid editor (col/row span) | HIGH | HIGH | P1 |
| Projects system + directory nav | HIGH | MEDIUM | P1 |
| Multi-upload + sharp pipeline | HIGH | MEDIUM | P1 |
| Auth.js + TOTP 2FA | HIGH | MEDIUM | P1 |
| R2 storage migration | HIGH | MEDIUM | P1 |
| Photo library (media manager) | HIGH | MEDIUM | P1 |
| Lightbox with keyboard nav | HIGH | LOW | P1 |
| Basic content protection (overlay, disable drag/right-click) | MEDIUM | LOW | P1 |
| EXIF extraction + storage | MEDIUM | LOW | P1 (done at ingest time with pipeline) |
| EXIF display in lightbox | MEDIUM | LOW | P2 |
| Crop tool in upload flow | MEDIUM | MEDIUM | P2 |
| Signed URLs + Cloudflare Worker proxy | MEDIUM | HIGH | P2 |
| Analytics dashboard | MEDIUM | LOW | P2 |
| DevTools detection | LOW | LOW | P2 |
| Watermark configurator UI | LOW | MEDIUM | P3 |
| Geographic analytics | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for milestone launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Squarespace/Format | SmugMug/Zenfolio | This Project |
|---------|-------------------|-----------------|--------------|
| Grid editor flexibility | Medium (Fluid Engine snaps to grid, but limited block sizes) | Low (album templates only) | High (custom col/row span, photographer defines columns) |
| Image protection | Basic (right-click disable, optional watermark) | Good (password galleries, watermark, download control) | High (watermark + overlay + signed URLs + DevTools detect) |
| EXIF display | Not standard | Optional per-gallery setting | In lightbox panel, per-photo |
| Photo management | Basic upload + organize | Robust (bulk upload, folders, keywords) | Targeted (upload pipeline, library, EXIF, watermark) |
| 2FA admin auth | Yes (platform-level) | Yes (platform-level) | TOTP via Auth.js (self-hosted) |
| Custom layout control | Medium (template-bound) | Low (album layout only) | High (block-based, photographer-defined) |
| Analytics | Basic (built-in) | Good (visit tracking, referrers) | Cloudflare Web Analytics + optional custom |
| Cost | $16–$40/month | $11–$42/month | Free tier (R2 + Vercel + Cloudflare) |

---

## Important Caveats on Image Protection

Research consistently shows: **no client-side protection is absolute.** Key findings:

1. **What works well:** Visible watermarks, low-resolution display versions, signed/expiring URLs, legal copyright notice, DMCA registration. These create real friction and legal recourse.

2. **What is deterrence only:** Right-click disable, drag disable, CSS overlay, DevTools detection. These stop casual users, not determined scrapers. A browser's network tab or a screen recording bypasses all of these.

3. **The practical threshold:** The goal is to raise the cost above "casual copy-paste" for visitors, and to ensure any stolen image carries a watermark that ties it back to the photographer. Full prevention is not achievable.

4. **Signed URLs gotcha:** R2 presigned URLs cannot be used directly with a custom domain — they expose the raw `*.r2.cloudflarestorage.com` host. A Cloudflare Worker acting as a proxy is required to sign requests while serving from the custom domain. This adds meaningful complexity and should be treated as P2.

---

## Sources

- [SmugMug image protection features](https://www.smugmughelp.com/hc/en-us/articles/18212607353108-Protect-my-images)
- [Kinsta: How to protect images on your site](https://kinsta.com/blog/protect-images/)
- [Cloudflare R2 presigned URLs docs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Cloudflare Worker proxy for R2 access control](https://blog.dankying.com/en/posts/20250429-how-to-build-an-image-service-using-cloudflare-workers/)
- [sharp Node.js image processing](https://sharp.pixelplumbing.com/)
- [siteguard: DevTools detection library](https://github.com/luizbizzio/siteguard)
- [Defeating DevTools Detection](https://blog.exploit.cat/defeating-devtools-detection/) (confirms all detection methods have bypasses)
- [dnd-grid React](https://dnd-grid.com/)
- [Cloudflare Web Analytics privacy-first](https://www.cloudflare.com/web-analytics/)
- [TOTP in Next.js with NextAuth](https://dev.to/corbado/how-to-implement-totp-authentication-in-nextjs-secure-2fa-login-step-by-step-3aip)
- [Beyondspace: Lightbox features for photographer sites](https://www.beyondspace.studio/blog/lightbox-features-ideal-for-a-photographer)
- [Image scraping protection overview 2025](https://webcopyrightchecker.com/blog/image-scraping-protection-prevention)
- [Photography portfolio website examples 2026](https://expertphotography.com/photography-portfolio-websites)

---
*Feature research for: Photography portfolio with block editor and image management admin*
*Researched: 2026-03-10*
