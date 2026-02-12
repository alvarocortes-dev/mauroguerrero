# Roadmap: Mauro Guerrero Photography Portfolio

## Overview

This roadmap transforms an existing photography portfolio with working masonry gallery and basic editor into a production-ready site with professional photo viewing, project management, and inline admin editing. Four phases deliver the experience: first, a robust photo viewer with zoom and gallery effects; second, public-facing project pages with flexible layouts; third, the admin overlay system for home gallery management; and fourth, the sophisticated grid editor for project composition. Each phase builds on the previous, with the photo viewer foundation enabling everything that follows.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Photo Viewer & Gallery Effects** - Professional lightbox with zoom, pan, navigation, and grayscale-to-color hover
- [ ] **Phase 2: Projects Infrastructure** - Public project pages with row-based layouts and 12-column grid
- [ ] **Phase 3: Admin System** - Admin overlay routes, home gallery editing, and contact form integration
- [ ] **Phase 4: Project Editor** - Grid layout editor for project composition with drag-drop and auto-save

## Phase Details

### Phase 1: Photo Viewer & Gallery Effects
**Goal**: Users can view photos professionally with zoom, pan, and navigation across the entire portfolio
**Depends on**: Nothing (first phase)
**Requirements**: VIEW-01, VIEW-02, VIEW-03, VIEW-04, VIEW-05, VIEW-06, VIEW-07, VIEW-08, GALL-01, GALL-02, GALL-03
**Success Criteria** (what must be TRUE):
  1. User can click any gallery photo and view it in a lightbox modal that adapts to the photo's aspect ratio
  2. User can zoom in/out via click or scroll wheel and drag to pan around zoomed photos
  3. User can navigate between photos with arrow buttons, keyboard shortcuts (arrow keys), and close with ESC or floating X button
  4. Gallery photos display in grayscale by default and smoothly transition to color on hover
  5. Transitions between photos are smooth and animated, creating a professional viewing experience
**Plans**: TBD

Plans:
- [ ] 01-01: [TBD during planning]

### Phase 2: Projects Infrastructure
**Goal**: Users can browse project pages with flexible row-based layouts that showcase photo stories
**Depends on**: Phase 1 (projects reuse photo viewer modal)
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05, PROJ-06, PROJ-07
**Success Criteria** (what must be TRUE):
  1. User can access projects via expandable sub-menu in sidebar navigation
  2. User can navigate to project pages where only the content area changes (sidebar stays fixed)
  3. Project pages display rows with multiple columns using a 12-column grid system
  4. Rows contain images, text blocks, and blank spacers with independently adjustable column widths
  5. User can click photos in projects and view them in the same lightbox viewer (with zoom, pan, navigation)
**Plans**: TBD

Plans:
- [ ] 02-01: [TBD during planning]

### Phase 3: Admin System
**Goal**: Admin can edit the home gallery and manage content through overlay controls on the live site
**Depends on**: Phase 2 (admin needs project infrastructure for context)
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04, ADMN-05, ADMN-06, ADMN-07, ADMN-08, CONT-01
**Success Criteria** (what must be TRUE):
  1. Admin can access `/admin` routes that render the exact public site view with floating edit controls overlaid
  2. Admin routes are protected by Supabase authentication and redirect unauthenticated users to login
  3. Admin can add, remove, and reorder photos in the home gallery via drag-and-drop
  4. Admin can edit photo metadata including caption, alt text, B&W flag, and size adjustment
  5. Contact form sends real emails via Resend when visitors submit inquiries
**Plans**: TBD

Plans:
- [ ] 03-01: [TBD during planning]

### Phase 4: Project Editor
**Goal**: Admin can create and edit project pages with a WYSIWYG grid editor for complete compositional control
**Depends on**: Phase 3 (admin overlay architecture must be in place)
**Requirements**: ADMN-09, ADMN-10, ADMN-11, ADMN-12, ADMN-13, ADMN-14, ADMN-15, ADMN-16, ADMN-17
**Success Criteria** (what must be TRUE):
  1. Admin can create new projects with title and slug from the admin interface
  2. Admin can edit existing projects inline on the real site view with WYSIWYG editing
  3. Admin can add, remove, and reorder rows within projects, and add/remove columns within rows
  4. Admin can drag to resize column widths on the 12-column grid with visual feedback
  5. Admin can upload images, add/edit rich text content, and add blank spacers to columns
  6. Changes auto-save with debouncing and visual feedback (saving/saved indicators)
**Plans**: TBD

Plans:
- [ ] 04-01: [TBD during planning]

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Photo Viewer & Gallery Effects | 0/TBD | Not started | - |
| 2. Projects Infrastructure | 0/TBD | Not started | - |
| 3. Admin System | 0/TBD | Not started | - |
| 4. Project Editor | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-12*
*Last updated: 2026-02-12*
