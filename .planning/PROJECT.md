# Mauro Guerrero Photography Portfolio

## What This Is

A professional photography portfolio website for Mauro Guerrero. The site is minimalist and elegant, featuring a main photo gallery with a masonry grid, project/portfolio pages with flexible row-based layouts, and an in-place admin system where the owner edits the live site directly through floating controls. Built with Next.js, PostgreSQL, Cloudinary, and Supabase auth.

## Core Value

The photographer can showcase their work beautifully and manage all content themselves through a visual editor that matches exactly what visitors see — no separate CMS, no disconnected admin panel.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Masonry photo gallery on home page — existing
- ✓ Dark/light theme toggle with CSS variables — existing
- ✓ Contact modal with form — existing
- ✓ Credits modal — existing
- ✓ Responsive sidebar navigation with mobile menu — existing
- ✓ Basic drag-and-drop editor for layout items — existing
- ✓ Image upload to Cloudinary — existing
- ✓ Supabase authentication (login page, middleware protection) — existing
- ✓ Layout persistence to PostgreSQL via Drizzle ORM — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] Photo viewer modal with adaptive aspect-ratio, close button (floating X above modal), and prev/next navigation
- [ ] Photo zoom with click (toggle zoom in/out) and scroll wheel, with drag-to-pan when zoomed
- [ ] Grayscale-to-color hover effect on gallery photos (configurable per photo — some stay B&W)
- [ ] Projects section accessible via expandable sub-menu in sidebar
- [ ] Project pages with row-based layout system (12-column grid for flexible column widths)
- [ ] Project rows support: images (multiple per row with adjustable widths), text blocks, and blank spacers
- [ ] Photos in projects reuse the same viewer modal (zoom, pan, navigation)
- [ ] Admin route overlay (`/admin/*`) showing exact public view with floating edit controls
- [ ] Admin for home gallery: add/remove photos, reorder, edit metadata (caption, alt, B&W flag), adjust size
- [ ] Admin for projects: create/edit/delete projects, row-based WYSIWYG editor with drag-to-resize columns
- [ ] Contact form connected to Resend for real email delivery

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Sobre mí page — pending photographer meeting to define content
- Diarios section — pending photographer meeting
- 35mm section — pending photographer meeting
- Blog section — pending photographer meeting
- Social media link destinations — pending photographer input
- OAuth/magic link login — email/password via Supabase sufficient
- Mobile app — web-first
- Real-time collaboration — single admin user
- Image editing/cropping in admin — photos uploaded as-is, Cloudinary handles optimization
- SEO/analytics — defer to future milestone

## Context

The site is a brownfield project with a working foundation. The existing masonry gallery renders correctly, the theme system works, and the basic editor infrastructure (Zustand store, dnd-kit, Cloudinary uploads, API routes) is in place. However, the current editor renders at different proportions than the public site — the key transformation is making admin edit the actual live view.

**Tech already installed but unused:** TipTap (rich text editor), react-virtuoso (virtual scroll), AWS S3 SDK. TipTap will be useful for text blocks in project rows.

**Architecture pattern:** Next.js route groups — `(site)` for public, `(editor)` for current editor. The new admin will use a `/admin` route prefix that renders the same layouts as the public site but with edit controls overlaid.

**Database:** Single `layouts` table stores layout data as JSONB. This will need to extend to support multiple project layouts (each project = a layout with its own slug).

## Constraints

- **Tech stack**: Next.js 16 + React 19 + Tailwind v4 + Drizzle + Supabase + Cloudinary — all already in place
- **Design**: Minimalist and elegant — no cluttered UI, no unnecessary features
- **Admin UX**: Must match public view exactly — no separate admin interface with different proportions
- **Performance**: Gallery images need efficient loading (Cloudinary transformations, lazy loading)
- **Grid system**: 12-column grid for project row editor (consistent, predictable)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| /admin route overlay instead of separate editor | Owner must see exactly what visitors see while editing | — Pending |
| 12-column grid for project rows | Predictable, well-understood system (Bootstrap-like) | — Pending |
| Row-based layout for projects (not masonry) | Projects need editorial control over photo arrangement and sizing | — Pending |
| Drag-to-pan for zoomed photos | Most intuitive for desktop photo viewing | — Pending |
| Sidebar sub-menu for projects | Keeps navigation consistent, no extra pages needed for project listing | — Pending |
| Resend for contact emails | Modern, developer-friendly email API | — Pending |
| Reuse photo viewer modal across gallery and projects | Consistent UX, single implementation | — Pending |

---
*Last updated: 2026-02-12 after initialization*
