# Project Research Summary

**Project:** Photography Portfolio with Admin CMS (Next.js 16)
**Domain:** Professional photography portfolio with interactive photo viewer, project management, and inline admin editing
**Researched:** 2026-02-12
**Confidence:** HIGH for core stack and architecture, MEDIUM-HIGH for features and pitfalls

## Executive Summary

Building a professional photography portfolio requires a tightly coordinated frontend with an admin CMS overlay. The research across technology stack, features, architecture, and pitfalls reveals a clear pattern: lightweight, battle-tested components for photo viewing (react-photo-view), sophisticated grid layout management (react-grid-layout v2), and seamless admin overlays using Next.js parallel routes. The biggest risk is not technical complexity but cascading failures from hydration mismatches, missing mobile support, and lacking persistence—all of which can silently destroy the user experience. The recommended approach prioritizes the photo viewer experience first (with rigorous mobile testing), then layers in admin functionality (with SSR guards), and finally tackles the complex grid editor (with version-aware conflict detection). Three critical pitfalls dominate: hydration mismatches in the admin overlay, missing pinch-to-zoom on mobile devices, and gallery performance collapse from unoptimized image loading. Addressing these upfront saves weeks of post-launch firefighting.

The portfolio itself is relatively straightforward—it's a gallery-first product where the images are the interface. The differentiator is the inline admin editing capability, which is architecturally complex because it requires rendering public views with overlay controls without navigation changes. This is solvable with Next.js 16's parallel routes and intercepting routes, but requires careful hydration management and state organization.

## Key Findings

### Recommended Stack

The technology stack balances minimalism with production-readiness. For photo viewing, **react-photo-view** (1.2.7) is the clear choice: 7KB gzipped, zero dependencies, native gesture support (drag, pinch-to-zoom, two-finger zoom), spring animations, and perfect Cloudinary integration. It's more lightweight than react-photoswipe-gallery and avoids the unmaintained react-image-lightbox entirely. For grid layout editing, **react-grid-layout v2** (2.2.2) is production-ready with complete TypeScript support, hooks-based API, native 12-column support, responsive breakpoints, and server-side rendering compatibility. For email delivery, **Resend + react-email** is the modern choice—React component-based templates, seamless Next.js App Router integration, and no spam filter headaches when properly configured.

**Core technologies:**
- **react-photo-view (1.2.7)**: Photo viewer lightbox with zoom/pan/rotation — chosen for zero dependencies, 7KB size, native mobile gesture support, and perfect Cloudinary compatibility
- **react-grid-layout (2.2.2)**: 12-column responsive grid editor — chosen for TypeScript hooks API, breakpoint support, and production maturity
- **Resend (6.9.2) + react-email**: Email delivery with React components — chosen for modern API, React-native design, and built-in dark mode support
- **Zustand (5.0.11)**: Global state management — already in stack, perfect for photo viewer and editor state across routes
- **Drizzle ORM**: Database operations — already in stack, use for layout and project persistence
- **Cloudinary**: Image hosting and optimization — leverage for responsive image delivery via next/Image loader
- **Supabase Auth**: Authentication — already configured, use for /admin route protection

### Expected Features

The feature landscape divides clearly into table stakes (what users expect), differentiators (what makes this portfolio stand out), and anti-features (what to deliberately avoid). **Table stakes** include the photo lightbox viewer (users won't forgive a portfolio that can't display images properly), zoom & pan (photographers need to inspect details), next/previous navigation (keyboard shortcuts critical for usability), responsive masonry grid (must work on mobile), fast image loading (slow loading kills credibility), and clean mobile UI (auto-hide controls during viewing). The portfolio has already implemented some of these well (grayscale-to-color hover, responsive design).

**Differentiators** are where competitive advantage lies: inline admin editing (edit content while viewing the public site with overlay controls), project pages with rich 12-column layouts (editorial control over composition), and metadata display in lightbox (camera settings, location, date build client confidence). Client proofing galleries and print integration belong in v2+ and add significant complexity not justified at launch.

**Anti-features to avoid deliberately:** autoplay background videos (universally disliked, bandwidth waste), massive portfolios with 20+ galleries (choice paralysis, dilutes impact), real-time collaboration editor (sync complexity without clear value for solo photographer), heavy analytics tracking (contradicts minimalist philosophy), and generic blog sections (photographers don't maintain them, old posts hurt credibility).

**MVP features (Phase 1-3):**
- Responsive masonry gallery with lazy loading
- Photo lightbox with zoom/pan and keyboard controls
- Next/previous navigation within lightbox
- Touch pinch-to-zoom on mobile (critical: test on real iOS/Android)
- Project pages with 12-column grid layouts
- Inline admin editing with overlay controls
- Auto-save with version checking to prevent conflicts

### Architecture Approach

The architecture leverages Next.js 16's advanced routing (route groups and parallel routes) to achieve the inline editing UX without traditional route navigation. Public views live in `(site)` route group, admin routes in `(editor)`, and the clever part: admin overlays use `/admin` with parallel routes and intercepting routes to render public content with edit controls via the `@edit` slot. This preserves URL state, context, and allows deep-linking the edit state.

State management is sliced by feature: EditorStore for grid layout editing, ViewerStore for photo modal, AdminStore for overlay state. Components use Zustand hooks to access only what they need, avoiding prop drilling. The renderer layer separates MasonryGrid (home) from RowLayout (projects)—same Layout type, different rendering logic.

**Major components and their responsibilities:**
1. **MasonryGrid** — renders home gallery in masonry columns with lazy-loaded images
2. **RowLayout** — renders project gallery in 12-column responsive grid
3. **PhotoViewer** — global lightbox modal for viewing/navigating images across any gallery
4. **EditOverlay** — admin UI that appears over public content in /admin routes
5. **EditorCanvas** — full editing UI for grid layout reordering and composition
6. **Database layer** — Drizzle ORM with layout persistence, project metadata, image metadata

**Critical architectural patterns:**
- Route groups to separate public (site) from admin (editor) contexts with different layouts and auth
- Parallel routes with @edit slot to render admin overlays without navigation changes
- Intercepting routes to capture `/admin/.../*` and show modals
- Shared photo viewer via Zustand to avoid prop drilling across galleries
- Layout-specific renderers (MasonryGrid vs RowLayout) for different display rules

### Critical Pitfalls to Avoid

**1. Hydration mismatch with admin overlay** — Admin overlay renders conditionally based on Supabase auth state. On server, no auth context exists. On client, auth loads asynchronously. This breaks hydration if the overlay renders server-side. **Prevention:** Use dynamic import with `{ ssr: false }` for admin overlay, or defer rendering to useEffect after hydration completes. Never check auth during server render.

**2. Image zoom modal not cleaning up event listeners** — Zoom modal adds wheel, mouse, and touch event listeners. If modal closes without removing these, they remain attached and interfere with page scrolling and other interactions, causing memory growth and janky UI. **Prevention:** Every `addEventListener()` must have matching `removeEventListener()` in useEffect cleanup. Use AbortController to cancel listeners. Test by opening/closing modal repeatedly and verifying no console errors.

**3. Zoom component broken on mobile pinch gestures** — Zoom works with mouse wheel on desktop but pinch-to-zoom doesn't work on iOS Safari or Android. This silently breaks the core feature on the majority of users. **Prevention:** Test on actual iOS and Android devices (not Chrome DevTools emulation). Use react-zoom-pan-pinch v3.7.0+ (has pinch fixes). Provide fallback: visual pinch indicator, double-tap zoom alternative. Ensure images have explicit width/height to prevent iOS layout shifts.

**4. Cloudinary images not lazy-loading** — Gallery loads all images immediately even below-the-fold. With 20 4K images, page takes 15+ seconds and bandwidth explodes. **Prevention:** Add `loading="lazy"` to all below-the-fold images. Only preload hero/visible images. Defer zoom modal image loading. Test on slow 4G: FCP < 2s, LCP < 2.5s.

**5. Grid layout editor not persisting** — User creates layout, refreshes page, layout disappears. State lives only in React, no database save. **Prevention:** Implement auto-save: debounce changes 300ms, POST to API, show "Saving..." then "Saved". Store layout JSON in database. Fetch on page load to hydrate editor.

**6. Multi-admin simultaneous edits causing conflicts** — Two admins edit same project, each saves, second save overwrites first with no warning. **Prevention:** Add version/timestamp field to layouts. On save, include expected version. Server rejects if mismatch, returns conflict error. Show modal: "Project updated by Admin B. Reload to see new version?" For MVP, implement simple pessimistic locking: project locked for 60s on edit start.

**7. 12-column grid breaking at mobile breakpoints** — Layout looks perfect at 1200px but broken on 768px tablet (6 columns) and 320px mobile (4 columns). Admin creates desktop layout unaware of how bad it looks on mobile. **Prevention:** Define breakpoints before building: Desktop 12 cols, Tablet 8 cols, Mobile 4 cols. Configure in react-grid-layout: `{ lg: { cols: 12 }, md: { cols: 8 }, sm: { cols: 4 } }`. Editor UI shows current breakpoint with preview buttons. Test: arrange desktop, resize to tablet, verify layout doesn't break.

## Implications for Roadmap

Based on research findings, the project naturally divides into three phases with clear dependencies and escalating complexity. The ordering follows architectural constraints (photo viewer must work before editor can meaningfully edit photos), performance requirements (lazy loading must be built in from start, not added later), and pitfall prevention (each phase addresses critical pitfalls specific to that feature set).

### Phase 1: Photo Viewer Foundation
**Rationale:** Photo viewing is the core experience—a broken viewer destroys the entire portfolio. This phase must establish image performance, mobile gesture support, and keyboard accessibility before any admin features layer on top. It's also where most critical pitfalls live: missing lazy loading, mobile pinch broken, incorrect image sizing causing layout shift, event listener cleanup.

**Delivers:** A production-ready photo gallery experience
- Responsive masonry gallery on home with lazy-loaded images
- Photo lightbox modal with zoom, pan, and rotation
- Keyboard controls (arrow keys, ESC, etc.)
- Touch pinch-to-zoom on mobile (tested on real devices)
- Next/previous navigation
- Metadata display optional (can defer to v1.1)

**Features:** Photo Lightbox Viewer, Zoom & Pan, Next/Previous Navigation, Responsive Grid Gallery, Fast Image Loading, Mobile Support, grayscale-to-color hover
**Stack:** react-photo-view, Cloudinary, react-grid-layout for masonry layout
**Avoids:** Hydration mismatch (client-only viewer), event listener leaks (proper cleanup), mobile pinch broken (test on real devices), unoptimized images (lazy loading in), image sizing shifts (explicit width/height)

**Research flags:** None—react-photo-view is battle-tested, patterns well-documented. Standard implementation.

### Phase 2: Admin Overlay & Authentication
**Rationale:** Once the photo viewer works beautifully, layer in admin controls to edit content. This phase requires careful SSR handling (hydration guards) and session management (Page Visibility API for background tabs). It's architecturally more complex than Phase 1 but less feature-rich.

**Delivers:** Inline editing capability for portfolio content
- Authentication with Supabase (already configured)
- Admin overlay routes using parallel routes + intercepting routes
- Edit mode toggle on public pages
- Edit project layout modal (basic text/order changes)
- Save/discard changes with optimistic UI
- Session refresh when returning from background tab

**Uses:** Zustand for admin state, Supabase Auth (RLS for security), next/Image with Cloudinary, Next.js parallel routes
**Implements:** AdminLayout with @edit slot, EditOverlay component, visibility state management
**Avoids:** Hydration mismatch (dynamic import with ssr:false), stale sessions (visibilitychange listener), admin UI in public CSS (server-side auth check only)

**Research flags:**
- **Parallel routes pattern:** Verify intercepting routes correctly capture `/admin/[slug]/edit` without full page reload
- **Session management:** Test Page Visibility API integration with Supabase auth state

### Phase 3: Grid Layout Editor & Persistence
**Rationale:** The most complex phase—building an editor that lets admins customize 12-column layouts for project pages. This phase must handle responsive breakpoints, persistence with auto-save, version-aware conflict detection for multiple admins, and comprehensive mobile testing across tablet and phone.

**Delivers:** Full grid layout editing for project pages
- 12-column responsive grid editor with drag-drop reordering
- Breakpoint definitions: Desktop (12), Tablet (8), Mobile (4)
- Auto-save with debouncing and version checking
- Conflict detection when multiple admins edit simultaneously
- Undo/redo support (optional but recommended)
- Grid item property editor (size, position, type)
- Responsive preview in editor UI

**Features:** Project Pages with Rich Layouts, Inline Admin Editing (grid portion), Metadata Display optional, Storytelling Presentation (captions)
**Stack:** react-grid-layout with breakpoint config, Zustand for editor state, Drizzle for layout persistence, Resend for notification emails on conflicts (optional)
**Implements:** EditorCanvas, GridItem with drag-drop, layout versioning in database
**Avoids:** Breakpoint bugs (define all at start), lost edits (auto-save), conflicts (version checking), image sizing (explicit dimensions on all grid items)

**Research flags:**
- **Responsive breakpoints:** Verify layout doesn't break at 768px and 320px. Test on actual tablet and phone.
- **Grid state persistence:** Validate auto-save timing and conflict resolution UX.
- **Multi-admin UX:** Test simultaneous edits scenario, verify conflict messaging is clear.

### Phase Ordering Rationale

The three-phase structure follows both architectural and risk-management principles:

1. **Phase 1 first** because viewer is the MVP. Without it, the portfolio is unusable. Building it first unblocks everything that depends on it (admin can't meaningfully edit photos without a working viewer). Phase 1 also contains the highest-impact pitfalls that are cheaper to fix early: lazy loading, mobile gestures, image sizing.

2. **Phase 2 before Phase 3** because admin overlay authentication and route setup must be in place before the grid editor can save to protected API routes. The parallel routes pattern for admin overlays is foundational for edit mode UX in Phase 3.

3. **Phase 3 last** because it's the most complex and least MVP-critical. A photographer can launch with just the viewer (Phase 1) and basic edit capabilities (Phase 2). The sophisticated 12-column grid editor is a differentiator, not table stakes.

**Dependency resolution:**
- Phase 1's lazy loading and mobile testing uncover performance patterns used in Phase 3's grid editor
- Phase 2's auth middleware and overlay routes provide the foundation for Phase 3's edit state management
- Phase 1's Zustand stores (ViewerStore) precede Phase 2's AdminStore which precedes Phase 3's EditorStore—each layer depends on state management patterns established before it

### Research Flags

**Phase 1 — Photo Viewer Foundation:**
Standard patterns, no research needed. React-photo-view is battle-tested, Cloudinary integration is well-documented, lazy loading is native HTML. Focus is execution and mobile testing (real devices required).

**Phase 2 — Admin Overlay & Authentication:**
Moderate research needed:
- Parallel routes with intercepting routes: Next.js 16 documentation is clear, but actual implementation patterns in production apps are limited. Research needed on handling deep-linking edge cases.
- Page Visibility API + Supabase auth: Supabase has known issues with session handling in backgrounded tabs (identified in PITFALLS.md). Research needed on best practices for page visibility integration.

**Phase 3 — Grid Layout Editor & Persistence:**
Significant research needed:
- Responsive breakpoint UX: React-grid-layout docs cover configuration, but real-world UX for editing multiple breakpoints is sparse. Research needed on how professional page builders handle this.
- Multi-admin conflict resolution: Version checking + real-time sync are competing patterns. Research needed on which approach suits this use case (collaborative vs. pessimistic locking).
- Grid item layout algorithms: Intelligent row-breaking and responsive spanning logic isn't trivial. May need custom implementation beyond react-grid-layout's built-in features.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Recommendations backed by official docs (react-photo-view, react-grid-layout, Resend), verified against project constraints (React 19, Next.js 16, TypeScript). Alternatives analysis thorough. |
| **Features** | MEDIUM-HIGH | Table stakes derived from professional photography portfolio benchmarks (SiteBuilderReport, ExpertPhotography, Format Magazine). MVP definition aligns with industry research. Differentiators validated against competitive landscape. Anti-features supported by UX research. Minor uncertainty on exact metadata field requirements. |
| **Architecture** | HIGH | Next.js routing patterns (route groups, parallel routes, intercepting routes) are official and well-documented. State management approach (Zustand slicing) proven in production apps. Component responsibilities clearly aligned with feature requirements. Database schema inferred from layout complexity but not validated against actual data volume. |
| **Pitfalls** | MEDIUM | 10 pitfalls identified with prevention strategies. HIGH confidence in Pitfalls 1-3 and 5-7 (documented issues in official docs, community discussions, GitHub issues). MEDIUM confidence in Pitfalls 4 (Supabase session handling) and 8-10 (grid editor edge cases, multi-admin scenarios) where real-world production examples are sparse. Pitfalls derived from domain-specific research (photography portfolio research, lightbox comparison articles, grid editor analysis). Some pitfalls inferred from related domains (general React performance, general concurrent edit patterns). |

**Overall confidence:** HIGH for getting the project built and shipped. MEDIUM for predicting exactly how users will interact with admin features and grid editor—Phase 2 and 3 may need iteration based on real usage.

### Gaps to Address

1. **Cloudinary image metadata strategy** — Research defined lazy loading and optimization but not how to efficiently store/retrieve EXIF data, image dimensions, and alt text. During Phase 1 planning, validate schema for image metadata table.

2. **Mobile breakpoint UX details** — Research defined breakpoints (12/8/4 columns) but not how editor UI shows/switches between them. During Phase 3 planning, research page builder UX patterns (Webflow, Framer) for breakpoint editing.

3. **Conflict resolution UX** — Research identified version checking as solution but not the exact user messaging or workflow when conflicts occur. During Phase 3 planning, user test conflict scenarios to validate messaging is clear.

4. **Supabase session reliability** — PITFALLS.md notes session issues in Jan 2026 but current status unknown. Before Phase 2 implementation, verify Supabase auth stability in current version and test Page Visibility API integration thoroughly.

5. **Scale assumptions** — Architecture assumes single photographer (1 admin) or small team. If scale grows to 100+ admins editing simultaneously, real-time sync (WebSockets) may be necessary vs. current version-checking approach. Phase 3 should document this boundary.

6. **Client proofing gallery** — FEATURES.md defers this to v2+ but marked as HIGH complexity. Before v2 planning, research whether to build in-app or integrate external service (like Cloudinary's proofing tools or dedicated services like Frame.io).

## Sources

### Primary Sources (HIGH confidence)

- **[react-photo-view Documentation](https://react-photo-view.vercel.app/en-US/docs/getting-started)** — Official docs, verified API, version 1.2.7 tested
- **[react-grid-layout GitHub Releases](https://github.com/react-grid-layout/react-grid-layout/releases)** — Official repository, v2.2.2 verified as latest, TypeScript support confirmed
- **[Resend NPM](https://www.npmjs.com/package/resend)** — Official package, version 6.9.2, Next.js App Router integration
- **[Next.js 16 Route Groups Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)** — Official Next.js docs
- **[Next.js 16 Parallel Routes Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes)** — Official Next.js docs

### Secondary Sources (MEDIUM confidence)

- **[SiteBuilderReport: Photography Portfolios (2026)](https://www.sitebuilderreport.com/inspiration/photography-portfolios)** — Professional portfolio analysis, 25+ examples
- **[ExpertPhotography: 25 Best Photography Portfolio Websites (2026)](https://expertphotography.com/photography-portfolio-websites/)** — Industry benchmark
- **[DesignRush: Best Photography Portfolio Websites (2026)](https://www.designrush.com/best-designs/websites/trends/best-photography-portfolio-websites)** — Design analysis
- **[Format Magazine: Portfolio Mistakes to Avoid](https://www.format.com/magazine/resources/photography/8-mistakes-build-portfolio-website-photography)** — Industry best practices
- **[Zustand Official Docs - Slices Pattern](https://zustand.docs.pmnd.rs/guides/slices-pattern)** — State management patterns
- **[LogRocket: Comparing Top React Lightbox Libraries](https://blog.logrocket.com/comparing-the-top-3-react-lightbox-libraries/)** — Library comparison analysis
- **[Fstoppers: Photography Industry Predictions (2026)](https://fstoppers.com/opinion/11-predictions-photography-industry-2026-720319)** — Industry trends

### Tertiary Sources (MEDIUM-LOW confidence, needs validation)

- **[Supabase Auth Troubleshooting Documentation](https://supabase.com/docs/guides/auth/troubleshooting)** — Session issues noted but may not reflect current version stability
- **[Next.js Hydration Error Documentation](https://nextjs.org/docs/messages/react-hydration-error)** — General guidance, domain-specific application needs testing
- **[React Zoom Pan Pinch GitHub Issues](https://github.com/BetterTyped/react-zoom-pan-pinch/issues)** — Community-reported mobile issues, not officially confirmed as resolved in v3.7.0+

---

*Research completed: 2026-02-12*
*Synthesized by: Claude Opus 4.6*
*Ready for roadmap planning: YES*
