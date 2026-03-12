# Requirements: Mauro Guerrero Photography Portfolio

**Defined:** 2026-03-11
**Core Value:** The photographer can independently build and manage beautiful, custom-layout galleries with full creative control — fast, intuitive, and protected.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Security

- [x] **AUTH-01**: Self-hosted auth replacing Supabase via better-auth with Drizzle adapter (no inactivity suspension)
- [x] **AUTH-02**: Magic link email login + password authentication
- [x] **AUTH-03**: SMS verification as additional auth factor (free tier)
- [x] **AUTH-04**: Server-side auth checks on all protected routes (fix CVE-2025-29927 middleware bypass)
- [x] **AUTH-05**: Session management UI in admin (view and revoke active sessions)
- [x] **AUTH-06**: Encrypted secret storage for auth tokens in database

### Storage & Image Pipeline

- [ ] **STOR-01**: Migrate image storage from Cloudinary to Cloudflare R2
- [ ] **STOR-02**: Presigned direct-to-R2 upload (bypasses Vercel 4.5MB body limit)
- [ ] **STOR-03**: Auto-resize to multiple sizes on upload (thumbnail, medium, full)
- [ ] **STOR-04**: Auto-watermark application on upload (configurable position/opacity)
- [ ] **STOR-05**: EXIF metadata extraction and storage in DB on upload (before Sharp re-encodes)
- [ ] **STOR-06**: Crop/recorte tool in upload flow (user crops before publishing)
- [ ] **STOR-07**: Batch re-processing of existing library (re-watermark, re-resize)

### Grid Editor

- [ ] **GRID-01**: Configurable column count per layout (e.g., 3, 4, 5 columns)
- [ ] **GRID-02**: Add placeholder blocks (1x1 base) that resize by dragging edges/corners snapping to grid cells
- [ ] **GRID-03**: Assign block type after placement: image, video embed, text, spacer
- [ ] **GRID-04**: Block resize changes colSpan/rowSpan; blocked by occupied cells (no overlap)
- [ ] **GRID-05**: Drag & drop to reorder/reposition blocks within grid
- [ ] **GRID-06**: Undo/redo support (Ctrl+Z / Ctrl+Shift+Z)
- [ ] **GRID-07**: Responsive preview toggle (mobile/tablet/desktop) in editor

### Projects System

- [ ] **PROJ-01**: Create/edit/delete projects, each with its own editable grid layout
- [ ] **PROJ-02**: Directory-style expandable list navigation in sidebar menu
- [ ] **PROJ-03**: Project ordering controlled by photographer (drag to reorder)
- [ ] **PROJ-04**: Draft/published status per project (hide unpublished from public)

### Photo Library

- [ ] **LIBR-01**: Internal media manager showing all uploaded photos in grid view
- [ ] **LIBR-02**: Multi-file upload with drag & drop and file picker
- [ ] **LIBR-03**: Delete individual photos from library and R2 storage
- [ ] **LIBR-04**: Bulk select photos for batch delete or operations
- [ ] **LIBR-05**: Photo metadata display (filename, dimensions, size, EXIF summary)

### Lightbox / Photo Viewer

- [ ] **LBOX-01**: Click any photo to open full-resolution modal with background blur
- [ ] **LBOX-02**: Left/right arrow navigation between consecutive photos in same context
- [ ] **LBOX-03**: Keyboard navigation (arrows for prev/next, Escape to close)
- [ ] **LBOX-04**: EXIF metadata display panel within lightbox (camera, lens, aperture, ISO, etc.)
- [ ] **LBOX-05**: Zoom/pan on photo (scroll-to-zoom or pinch-to-zoom on mobile)

### Content Protection

- [ ] **PROT-01**: Disable right-click context menu on image elements
- [ ] **PROT-02**: Disable image dragging via CSS/JS
- [ ] **PROT-03**: CSS anti-selection on image containers
- [ ] **PROT-04**: Visible watermark burned into all displayed image variants
- [ ] **PROT-05**: Low-resolution display version; full quality only via signed/expiring URLs
- [ ] **PROT-06**: DevTools detection with content dimming (soft detection, not hard block)

### Site Management

- [ ] **SITE-01**: Edit About/Sobre Mí page content and profile photo from admin
- [ ] **SITE-02**: Edit contact links, email, and social media (RRSS) URLs from admin
- [ ] **SITE-03**: Edit credits page content from admin

### Workflow & Git

- [ ] **WORK-01**: Commits atómicos a medida que avanzan funcionalidades (mensajes en español)
- [ ] **WORK-02**: Sin Co-Authored-By de Claude — commits con el usuario nativo del repositorio
- [ ] **WORK-03**: Solo commits locales; el usuario hace push manualmente tras confirmar

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content Protection (Hardening)

- **PROT-07**: Cloudflare Worker proxy for signed URL serving with custom domain (URL obfuscation)
- **PROT-08**: Anti-scraping rate limiting and bot detection (Upstash rate limiter)

### Analytics

- **ANLY-01**: Cloudflare Web Analytics integration (one script tag)
- **ANLY-02**: Custom visit tracking dashboard in admin (page views, referrers, dates)
- **ANLY-03**: Geographic/origin data for visitor insights

### Editor Polish

- **GRID-08**: Block duplication (clone existing block with content)
- **GRID-09**: Advanced watermark configurator UI (position, opacity, text vs image)

### Photo Library Enhancements

- **LIBR-06**: Search/filter photos by project, date, or tags
- **LIBR-07**: Storage usage indicator

### Mobile Enhancements

- **LBOX-06**: Swipe gestures for lightbox navigation on mobile

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Categories/groupings for projects | User decided flat directory list is sufficient; ordering by photographer provides enough control |
| Native video upload/hosting | Storage costs prohibitive on free tier; YouTube/Vimeo embeds cover the need |
| Multi-user admin | Single photographer, single admin account |
| E-commerce / photo sales | Not a commerce platform |
| Blog / article system | Portfolio-only focus |
| Mobile app | Web-only, responsive design |
| Client gallery / proofing | Use dedicated tools (Pixieset, Pic-Time) for client delivery |
| Real-time collaborative editing | Single user; no benefit from websocket/CRDT complexity |
| AI auto-tagging | API cost and complexity; portfolio is small enough for manual management |
| Comment / guestbook system | Contact form is sufficient; comments require moderation |
| Hard DevTools block (crash browser) | Determined users bypass; breaks accessibility tools; soft detection is the limit |
| Screenshot blocking | Technically impossible at browser level; watermark + low-res display is the real protection |
| Recovery codes for 2FA | Deferred; single user can reset via DB access if needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

Note: WORK-01, WORK-02, WORK-03 are cross-cutting workflow constraints that apply to all phases. They are mapped to Phase 1 for traceability purposes.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| AUTH-06 | Phase 1 | Complete |
| STOR-01 | Phase 2 | Pending |
| STOR-02 | Phase 2 | Pending |
| STOR-03 | Phase 2 | Pending |
| STOR-04 | Phase 2 | Pending |
| STOR-05 | Phase 2 | Pending |
| STOR-06 | Phase 2 | Pending |
| STOR-07 | Phase 2 | Pending |
| GRID-01 | Phase 3 | Pending |
| GRID-02 | Phase 3 | Pending |
| GRID-03 | Phase 3 | Pending |
| GRID-04 | Phase 3 | Pending |
| GRID-05 | Phase 3 | Pending |
| GRID-06 | Phase 3 | Pending |
| GRID-07 | Phase 3 | Pending |
| PROJ-01 | Phase 4 | Pending |
| PROJ-02 | Phase 4 | Pending |
| PROJ-03 | Phase 4 | Pending |
| PROJ-04 | Phase 4 | Pending |
| LIBR-01 | Phase 5 | Pending |
| LIBR-02 | Phase 5 | Pending |
| LIBR-03 | Phase 5 | Pending |
| LIBR-04 | Phase 5 | Pending |
| LIBR-05 | Phase 5 | Pending |
| LBOX-01 | Phase 6 | Pending |
| LBOX-02 | Phase 6 | Pending |
| LBOX-03 | Phase 6 | Pending |
| LBOX-04 | Phase 6 | Pending |
| LBOX-05 | Phase 6 | Pending |
| PROT-01 | Phase 7 | Pending |
| PROT-02 | Phase 7 | Pending |
| PROT-03 | Phase 7 | Pending |
| PROT-04 | Phase 7 | Pending |
| PROT-05 | Phase 7 | Pending |
| PROT-06 | Phase 7 | Pending |
| SITE-01 | Phase 8 | Pending |
| SITE-02 | Phase 8 | Pending |
| SITE-03 | Phase 8 | Pending |
| WORK-01 | Phase 1 (cross-cutting) | Pending |
| WORK-02 | Phase 1 (cross-cutting) | Pending |
| WORK-03 | Phase 1 (cross-cutting) | Pending |

**Coverage:**
- v1 requirements: 46 total
- Mapped to phases: 46
- Unmapped: 0

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 — traceability populated after roadmap creation*
