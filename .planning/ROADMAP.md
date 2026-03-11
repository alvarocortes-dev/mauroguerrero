# Roadmap: Mauro Guerrero Photography Portfolio

## Overview

Eight phases following a strict dependency chain: auth and storage must be solid before images can be uploaded; images must exist before the grid editor is useful; the grid editor must be stable before projects can be built on top of it; the public site and lightbox complete the visitor experience; content protection and site management finish the admin surface. Backend work precedes frontend work within each phase wherever the two concerns exist in the same phase. Every phase delivers a coherent, independently verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Auth Migration** - Replace Supabase with better-auth (credentials + TOTP 2FA) and harden all protected routes against CVE-2025-29927
- [ ] **Phase 2: Storage + Image Pipeline** - Migrate Cloudinary to Cloudflare R2 and build the Sharp processing pipeline (EXIF, resize, watermark, WebP)
- [ ] **Phase 3: Grid Editor** - Build the block-based CSS Grid editor with custom dnd-kit collision detection, resize handles, and undo/redo
- [ ] **Phase 4: Projects System** - CRUD for projects with per-project grid layouts, draft/published status, and ordering control
- [ ] **Phase 5: Photo Library UI** - Internal media manager for browsing, managing, and bulk-operating on all uploaded photos
- [ ] **Phase 6: Public Site + Lightbox** - Public project pages, homepage grid, and full lightbox with keyboard navigation and EXIF display
- [ ] **Phase 7: Content Protection** - JS guards (right-click, drag, selection), DevTools detection, and low-res display with signed URL proxy
- [ ] **Phase 8: Site Management** - Admin panels for editing About page, contact links, and credits page content

## Phase Details

### Phase 1: Auth Migration
**Goal**: The photographer can log in with credentials and TOTP 2FA, with every protected route independently verified server-side — no Supabase dependency, no middleware-only auth bypass
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, WORK-01, WORK-02, WORK-03
**Success Criteria** (what must be TRUE):
  1. Photographer can log in via email/password and is prompted for TOTP code from authenticator app before access is granted
  2. Any attempt to access /editor routes without a valid session is rejected at the server level, not just middleware — the CVE-2025-29927 header bypass does not work
  3. Active sessions are visible and revocable from the admin session management UI
  4. TOTP secrets are stored encrypted in the database (not plaintext)
  5. Supabase SDK packages are removed from the codebase and package.json
**Plans**: TBD

Plans:
- [ ] 01-01: TBD

### Phase 2: Storage + Image Pipeline
**Goal**: Photos uploaded to the admin are processed by Sharp (EXIF extraction, three-size resize, watermark composite, WebP conversion) and stored in a private Cloudflare R2 bucket via presigned direct upload — bypassing the Vercel 4.5 MB body limit
**Depends on**: Phase 1
**Requirements**: STOR-01, STOR-02, STOR-03, STOR-04, STOR-05, STOR-06, STOR-07
**Success Criteria** (what must be TRUE):
  1. Photographer can upload a multi-megabyte RAW or JPEG file from the admin and it arrives in R2 without hitting Vercel's body size limit
  2. After upload, three image variants exist in R2 (thumbnail ~400px, medium ~1200px, full ~2400px) all converted to WebP with the watermark burned in
  3. EXIF metadata (camera, lens, aperture, ISO, shutter speed, date) is extracted and stored in the database before Sharp re-encodes the file
  4. Photographer can use the crop tool to adjust framing before the upload is finalized and processed
  5. Existing images in the old storage can be batch re-processed through the new pipeline (re-watermarked, re-resized)
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Grid Editor
**Goal**: The photographer can build a grid layout by adding blocks, assigning them types (image, video embed, text, spacer), dragging them to reorder/reposition, resizing them across columns and rows, and undoing any mistake — all without layout corruption
**Depends on**: Phase 2
**Requirements**: GRID-01, GRID-02, GRID-03, GRID-04, GRID-05, GRID-06, GRID-07
**Success Criteria** (what must be TRUE):
  1. Photographer can configure the column count for a layout and add blocks that snap to grid cells with correct colSpan/rowSpan values
  2. Blocks can be resized by dragging edges/corners; the grid rejects placements that would overlap an occupied cell
  3. Blocks can be dragged to new positions without producing incorrect drop targets or layout corruption, even when blocks have mixed sizes
  4. Ctrl+Z and Ctrl+Shift+Z undo and redo discrete actions (drag end, resize release, content blur)
  5. Photographer can toggle a responsive preview to see how the layout renders at mobile, tablet, and desktop widths
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Projects System
**Goal**: The photographer can create, edit, delete, and order projects — each with its own editable grid layout and a draft/published toggle that hides unpublished work from the public site
**Depends on**: Phase 3
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04
**Success Criteria** (what must be TRUE):
  1. Photographer can create a new project, open its grid editor, build a layout, and save it — independently of other projects
  2. Projects are listed in an expandable directory tree in the sidebar; dragging changes their display order on the public site
  3. A project marked as draft does not appear on the public site for visitors but remains accessible in the admin
  4. Deleting a project removes it and its associated layout data cleanly
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Photo Library UI
**Goal**: The photographer can browse, manage, and operate on all uploaded photos from an internal media manager — viewing metadata, deleting photos, and selecting batches for bulk operations
**Depends on**: Phase 2
**Requirements**: LIBR-01, LIBR-02, LIBR-03, LIBR-04, LIBR-05
**Success Criteria** (what must be TRUE):
  1. Photographer can see all uploaded photos in a grid view with filename, dimensions, file size, and an EXIF summary visible per photo
  2. Photographer can upload multiple files at once via drag & drop onto the library or a file picker dialog
  3. Photographer can select individual photos to delete, removing them from both the database and R2 storage
  4. Photographer can bulk-select multiple photos and perform batch delete or other operations in one action
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Public Site + Lightbox
**Goal**: Visitors can browse the photographer's projects, open any photo in a full-resolution lightbox with keyboard navigation and EXIF metadata, and the public site renders correctly from the shared GridRenderer used in the editor
**Depends on**: Phase 4, Phase 5
**Requirements**: LBOX-01, LBOX-02, LBOX-03, LBOX-04, LBOX-05
**Success Criteria** (what must be TRUE):
  1. Clicking any photo in a project grid opens a full-resolution modal with background blur
  2. Visitor can navigate between photos in the same project using left/right arrows and keyboard arrow keys; Escape closes the lightbox
  3. Lightbox shows an EXIF panel with camera model, lens, aperture, ISO, and shutter speed for the active photo
  4. Visitor can zoom into a photo by scrolling or pinching (on mobile)
  5. Public project pages render layout identically to the editor preview (shared GridRenderer component in use)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

### Phase 7: Content Protection
**Goal**: Images displayed on the public site are protected by multiple deterrent layers: right-click and drag are disabled, images are shown in low-resolution with full quality only via signed/expiring URLs, and DevTools detection dims the content
**Depends on**: Phase 6
**Requirements**: PROT-01, PROT-02, PROT-03, PROT-04, PROT-05, PROT-06
**Success Criteria** (what must be TRUE):
  1. Right-clicking on any image on the public site shows no context menu with a "Save image as" option
  2. Image elements cannot be dragged out of the browser window
  3. Visitor cannot select image areas using click-drag or Ctrl+A
  4. All image src attributes in the page source point to the signed URL proxy endpoint, never directly to R2 bucket URLs
  5. Low-resolution image variants are displayed by default; full-resolution is only accessible via a signed URL that expires after 15 minutes
  6. Opening browser DevTools triggers a soft content dimming effect on image areas
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

### Phase 8: Site Management
**Goal**: The photographer can update the About/Sobre Mí page (including profile photo), contact links and social media URLs, and credits page content — all from the admin, without touching code
**Depends on**: Phase 1
**Requirements**: SITE-01, SITE-02, SITE-03
**Success Criteria** (what must be TRUE):
  1. Photographer can upload a new profile photo and edit the bio text in the admin; changes are immediately visible on the public About page
  2. Photographer can update email address and social media URLs in the admin; the public contact section reflects the changes
  3. Photographer can edit the credits page content in the admin using the rich text editor
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order. Phase 5 (Photo Library UI) depends on Phase 2 and can run in parallel with Phase 4 if needed, but default order is sequential: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth Migration | 3/5 | In Progress|  |
| 2. Storage + Image Pipeline | 0/TBD | Not started | - |
| 3. Grid Editor | 0/TBD | Not started | - |
| 4. Projects System | 0/TBD | Not started | - |
| 5. Photo Library UI | 0/TBD | Not started | - |
| 6. Public Site + Lightbox | 0/TBD | Not started | - |
| 7. Content Protection | 0/TBD | Not started | - |
| 8. Site Management | 0/TBD | Not started | - |
