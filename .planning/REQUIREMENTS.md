# Requirements: Mauro Guerrero Photography Portfolio

**Defined:** 2026-02-12
**Core Value:** The photographer can showcase their work beautifully and manage all content themselves through a visual editor that matches exactly what visitors see.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Photo Viewer

- [ ] **VIEW-01**: User can click any gallery photo to open a lightbox modal
- [ ] **VIEW-02**: Lightbox modal adapts to the photo's aspect ratio (horizontal, vertical, 1:1) without overflow or hidden content
- [ ] **VIEW-03**: User can zoom in/out via click (toggle) and scroll wheel, always within the modal bounds
- [ ] **VIEW-04**: User can drag to pan around a zoomed photo
- [ ] **VIEW-05**: Lightbox has a floating X close button centered above the modal
- [ ] **VIEW-06**: User can navigate to next/previous photo via visible arrows or hints
- [ ] **VIEW-07**: User can navigate photos with keyboard (arrow keys for nav, ESC to close)
- [ ] **VIEW-08**: Transitions between photos in the viewer are smooth and animated

### Gallery Effects

- [ ] **GALL-01**: Gallery photos display in grayscale by default
- [ ] **GALL-02**: Gallery photos transition to color on hover (smooth CSS transition)
- [ ] **GALL-03**: Grayscale/color behavior is configurable per photo (some photos stay B&W)

### Projects

- [ ] **PROJ-01**: Sidebar navigation shows expandable sub-menu listing available projects
- [ ] **PROJ-02**: Clicking a project navigates to its page (only left content area changes, sidebar stays fixed)
- [ ] **PROJ-03**: Project pages use a row-based layout where each row contains content blocks
- [ ] **PROJ-04**: Each row supports multiple columns on a 12-column grid system
- [ ] **PROJ-05**: Columns can contain images, text blocks, or blank spacers
- [ ] **PROJ-06**: Each column's width is independently adjustable within the 12-column grid
- [ ] **PROJ-07**: Photos in project pages are clickable and open the same lightbox viewer (zoom, pan, navigation)

### Admin — General

- [ ] **ADMN-01**: `/admin` route renders the exact public site view with floating edit controls overlaid
- [ ] **ADMN-02**: Admin routes are protected by Supabase authentication (redirects to login if unauthenticated)
- [ ] **ADMN-03**: Admin controls are visually distinct but non-intrusive (floating, contextual)

### Admin — Home Gallery

- [ ] **ADMN-04**: Admin can add new photos to the home gallery
- [ ] **ADMN-05**: Admin can remove photos from the home gallery
- [ ] **ADMN-06**: Admin can reorder photos in the home gallery (drag-and-drop)
- [ ] **ADMN-07**: Admin can edit photo metadata (caption, alt text, B&W flag)
- [ ] **ADMN-08**: Admin can adjust photo size in the gallery grid

### Admin — Projects

- [ ] **ADMN-09**: Admin can create new projects (title, slug)
- [ ] **ADMN-10**: Admin can edit existing projects inline (WYSIWYG on the real site view)
- [ ] **ADMN-11**: Admin can delete projects
- [ ] **ADMN-12**: Admin can add/remove rows in a project
- [ ] **ADMN-13**: Admin can add/remove columns within a row
- [ ] **ADMN-14**: Admin can drag to resize column widths on the 12-column grid
- [ ] **ADMN-15**: Admin can upload images to columns via Cloudinary
- [ ] **ADMN-16**: Admin can add/edit text content in columns (using TipTap rich text)
- [ ] **ADMN-17**: Admin can add blank spacer columns for compositional control

### Contact Form

- [ ] **CONT-01**: Contact form sends real emails via Resend when submitted

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Additional Sections

- **SECT-01**: "Sobre mí" page with photographer bio and photo
- **SECT-02**: "Diarios" section (format TBD — pending photographer meeting)
- **SECT-03**: "35mm" section for analog photography (format TBD)
- **SECT-04**: Blog section (format TBD)

### Social & SEO

- **SOCL-01**: Social media links connected to real profiles
- **SEO-01**: SEO metadata and Open Graph tags for sharing
- **SEO-02**: Analytics integration

### Notifications

- **NOTF-01**: Admin receives notification when contact form is submitted

## Out of Scope

| Feature | Reason |
|---------|--------|
| OAuth / magic link login | Email/password via Supabase is sufficient for single admin |
| Mobile app | Web-first approach |
| Real-time collaboration | Single admin user, no concurrent editing needed |
| Image editing/cropping in admin | Photos uploaded as-is, Cloudinary handles optimization |
| E-commerce / print sales | Not part of portfolio vision |
| Client proofing galleries | Defer to v2+ if photographer requests |
| Autoplay media | Anti-pattern for photography portfolios per research |
| Video posts | Storage/bandwidth complexity, defer to future |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| VIEW-01 | — | Pending |
| VIEW-02 | — | Pending |
| VIEW-03 | — | Pending |
| VIEW-04 | — | Pending |
| VIEW-05 | — | Pending |
| VIEW-06 | — | Pending |
| VIEW-07 | — | Pending |
| VIEW-08 | — | Pending |
| GALL-01 | — | Pending |
| GALL-02 | — | Pending |
| GALL-03 | — | Pending |
| PROJ-01 | — | Pending |
| PROJ-02 | — | Pending |
| PROJ-03 | — | Pending |
| PROJ-04 | — | Pending |
| PROJ-05 | — | Pending |
| PROJ-06 | — | Pending |
| PROJ-07 | — | Pending |
| ADMN-01 | — | Pending |
| ADMN-02 | — | Pending |
| ADMN-03 | — | Pending |
| ADMN-04 | — | Pending |
| ADMN-05 | — | Pending |
| ADMN-06 | — | Pending |
| ADMN-07 | — | Pending |
| ADMN-08 | — | Pending |
| ADMN-09 | — | Pending |
| ADMN-10 | — | Pending |
| ADMN-11 | — | Pending |
| ADMN-12 | — | Pending |
| ADMN-13 | — | Pending |
| ADMN-14 | — | Pending |
| ADMN-15 | — | Pending |
| ADMN-16 | — | Pending |
| ADMN-17 | — | Pending |
| CONT-01 | — | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 0
- Unmapped: 29 ⚠️

---
*Requirements defined: 2026-02-12*
*Last updated: 2026-02-12 after initial definition*
