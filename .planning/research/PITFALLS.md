# Pitfalls Research

**Domain:** Next.js photography portfolio with inline admin editing, photo viewer with zoom/pan, and grid-based layout editor

**Researched:** 2026-02-12

**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Hydration Mismatch with Admin Overlay

**What goes wrong:**
Admin overlay UI renders conditionally on the server based on authentication state, but client-side renders differently due to auth not being available during initial hydration. Causes "Text content does not match server-rendered HTML" errors and React discards server-rendered DOM, forcing full re-render.

**Why it happens:**
Admin routes check Supabase auth state (`useUser()`) before rendering the overlay. On server, no auth context exists. On client, auth loads asynchronously. Admin UI visibility differs between server and client, breaking hydration contract.

**How to avoid:**
- Use dynamic imports with `{ ssr: false }` for admin overlay component to skip server rendering entirely
- Defer admin UI rendering until after hydration completes using `useEffect`
- If admin UI must render, use consistent skeleton/placeholder on both server and client
- Never let authentication state influence server-rendered HTML structure
- Use `useId()` for any IDs in admin controls to ensure consistency

**Warning signs:**
- Console errors starting with "Hydration failed" or "Text content does not match"
- Admin controls not responding to clicks after page load
- Visual flash when page loads (server HTML replaced by client render)
- Clicking admin button doesn't work until page is manually refreshed

**Phase to address:**
Phase 2 (Admin Overlay) - Must be prevented during initial implementation, not fixed later

---

### Pitfall 2: Image Zoom Modal State Not Cleaning Up Event Listeners

**What goes wrong:**
Zoom/pan modal accepts wheel, mouse, and touch events. If the modal closes without removing these listeners, they remain attached to document, causing:
- Multiple listeners firing for every scroll/drag even when modal is closed
- Memory growth as modals open/close repeatedly
- Scroll handlers interfering with page navigation
- Pan/zoom behaviors leaking into other modals

**Why it happens:**
Developers add event listeners to enable zoom (wheel scroll to zoom, mouse drag to pan, touch pinch). When modal unmounts, listeners aren't removed because `useEffect` cleanup function is missing or incomplete.

**How to avoid:**
- Every `addEventListener()` must have matching `removeEventListener()` in useEffect cleanup
- Use AbortController to cancel event listeners: `addEventListener('wheel', handler, { signal: controller.signal })`
- Test by: open modal, close modal, verify scroll still works normally, check no console errors
- Consider using a React library (react-zoom-pan-pinch v3+) that handles cleanup automatically
- Log listeners on mount/unmount during development: `console.log('listeners added')` in useEffect, `console.log('listeners removed')` in cleanup

**Warning signs:**
- Page becomes sluggish after opening/closing modal multiple times
- Browser DevTools shows increasing number of event listeners
- Scrolling behaves strangely after closing zoom modal
- Other modals exhibit unexpected zoom behavior

**Phase to address:**
Phase 1 (Photo Viewer Modal) - Must be caught during initial zoom implementation

---

### Pitfall 3: Zoom Component Not Working on Mobile Pinch Gestures

**What goes wrong:**
Zoom works with mouse wheel and desktop, but pinch-to-zoom on mobile doesn't work. Two-finger pinch doesn't register, and single-finger drag is inconsistent. This is particularly broken on Safari iOS.

**Why it happens:**
Mouse events (wheel, mousedown, mousemove) don't fire on touch. Touch events and pointer events handle multi-touch, but pinch zoom requires interpreting the distance between two touch points. Libraries like react-zoom-pan-pinch have known issues when two fingers touch the screen simultaneously. Next.js Image component with Cloudinary URLs can also break zoom on iOS with intrinsic layout.

**How to avoid:**
- Test on actual iOS and Android devices, not just Chrome DevTools mobile emulation
- If using react-zoom-pan-pinch, verify version 3.7.0+ is installed (has pinch fixes)
- Ensure `<img>` or Next.js Image has explicit width/height to prevent iOS layout shifts that break gestures
- Avoid setting `unoptimized={true}` on next/Image when using zoom libraries—let Cloudinary loader handle optimization
- Provide fallback: show visual pinch indicator on mobile, allow double-tap to zoom as alternative
- Test with 2 fingers touching simultaneously and verify it doesn't crash zoom handler

**Warning signs:**
- Mobile users report zoom doesn't work
- Single touch drag is janky or doesn't work
- Double-tap zoom works but pinch zoom doesn't
- iOS shows broken image dimensions in lightbox
- Zoom works on Chrome desktop but not mobile Safari

**Phase to address:**
Phase 1 (Photo Viewer Modal) - Must test on real devices before shipping

---

### Pitfall 4: Admin Overlay Route Not Respecting Page Visibility/Tab Visibility

**What goes wrong:**
Admin overlay stays visible/active when user switches browser tabs. Supabase auth session may hang, `onAuthStateChange` stops firing, `refreshSession` hangs indefinitely. When returning to tab, overlay is stale or broken. This is especially problematic for /admin route which requires continuous auth checks.

**Why it happens:**
Supabase auth client has known issues (Jan 2026) where `onAuthStateChange` doesn't trigger intermittently and `refreshSession`/`getUser` hang indefinitely when page is backgrounded. Admin overlay doesn't listen to page visibility changes, so it doesn't know to pause/resume auth polling or refresh session.

**How to avoid:**
- Listen to Page Visibility API: `document.addEventListener('visibilitychange', ...)`
- On `visibilitychange`, if returning to foreground: immediately call `supabase.auth.refreshSession()`
- Pause any polling/subscriptions when tab is hidden (reduces load, prevents hangs)
- Add timeout to all Supabase auth calls (shouldn't hang indefinitely)
- Show visual indicator when session is stale/refreshing: "Updating permissions..." banner
- Test: Open /admin, switch to another tab for 30+ seconds, come back, verify overlay still responsive

**Warning signs:**
- Admin controls stop responding after switching tabs
- Console shows "session is null" errors after returning from other tab
- Supabase auth calls hang indefinitely
- Manual refresh required to restore /admin functionality
- "Stale session" errors appear in production logs

**Phase to address:**
Phase 2 (Admin Overlay) - Must implement visibility handling alongside auth setup

---

### Pitfall 5: Cloudinary Images Not Lazy-Loading, Causing Gallery Performance Collapse

**What goes wrong:**
All portfolio images load immediately on page load, even below-the-fold. First project page with 20 images tries to load all at once. With large 4K images from Cloudinary, bandwidth explodes and page takes 15+ seconds. Bounce rate skyrockets because user bounces before images load.

**Why it happens:**
Developers don't add `loading="lazy"` to images or assume Cloudinary auto-optimizes load timing (it doesn't). Every `<Image>` component from next/image creates a fetch. Zoom modal preloading all images makes it worse. Portfolio users scroll through projects linearly, but all images load regardless of visibility.

**How to avoid:**
- Add `loading="lazy"` to all below-the-fold images (native HTML attribute)
- For next/Image with Cloudinary: Cloudinary loader still respects loading="lazy", no override needed
- Only preload hero/first images visible on page load
- Defer zoom modal image loading: don't load full-res until modal opens (load thumbnail instead)
- Monitor: Test on slow 4G. First Contentful Paint (FCP) should be < 2s, Largest Contentful Paint (LCP) < 2.5s
- Test with DevTools: Throttle to "Slow 4G", measure time to see 3 images

**Warning signs:**
- Page takes > 5 seconds to load on slow networks
- Zoom modal takes several seconds to show high-res image
- First project page shows spinner for 10+ seconds
- Lighthouse score < 50 on performance
- Production shows $800-3000/month extra CDN costs (sign of over-preloading)

**Phase to address:**
Phase 1 (Photo Viewer) and Phase 3 (Project Pages) - Lazy loading must be built in from start

---

### Pitfall 6: Grid Layout Editor Not Persisting Row Data Between Sessions

**What goes wrong:**
User creates 12-column layout with 3 rows of images, carefully arranges photos. Refreshes page or closes browser. Layout reverts to default grid or shows errors. No persistence layer saves the editor state, so all work is lost.

**Why it happens:**
Grid layout state (positions, sizes) lives only in React state (useState or context). When page reloads, server serves default layout. No database save, no debounced persistence, no "auto-save" message. Developers assume users won't refresh mid-edit (false assumption).

**How to avoid:**
- Implement auto-save: debounce layout changes (300ms) and POST to /api/layout with latest grid state
- Store in database: Save to `project_layouts` table with `layout_config` JSON column
- Show auto-save indicator: "Saving..." then "Saved" on success
- Implement undo/redo using layout history: Keep array of past states, allow restore
- On page load, fetch current layout from DB and hydrate grid component
- Test: Arrange grid, hit refresh, verify layout persists
- Add optimistic UI: Show changes immediately, revert if save fails

**Warning signs:**
- Users report work "disappearing" after refresh
- Grid shows loading skeleton for 2+ seconds after page load
- No save feedback (users don't know if changes persisted)
- Multiple admins editing same project simultaneously = layout conflicts
- Database has no `project_layouts` table

**Phase to address:**
Phase 3 (Grid Editor) - Must implement persistence from day 1, not as afterthought

---

### Pitfall 7: Incorrect Image Sizing Causing Layout Shift During Zoom

**What goes wrong:**
Zoom modal opens with thumbnail dimensions, then 1-2 seconds later high-res image loads and modal container jumps/resizes. Creates Cumulative Layout Shift (CLS) even though it's a modal. On slow networks, shift is obvious and jarring.

**Why it happens:**
When high-res image loads, aspect ratio differs from thumbnail or no width/height was specified, so modal container recalculates size. This is the #1 performance issue in photography portfolios: incorrect/missing sizing information.

**How to avoid:**
- Always provide explicit width and height to Image component or reserve space with aspect-ratio CSS
- Calculate high-res dimensions: `aspect_ratio = thumbnail.width / thumbnail.height`, then apply to modal
- For Cloudinary: Get image metadata (fetch from API or store during upload), use real dimensions
- Use CSS aspect-ratio to reserve space: `.zoom-modal-image { aspect-ratio: 16/9; }`
- Pre-render modal container with image dimensions before loading: `<div style={{ aspectRatio: '16/9' }}>`
- Test with DevTools: Open Performance tab, check CLS metric should be 0 (no shift)

**Warning signs:**
- Modal visibly jumps when image loads
- DevTools Lighthouse shows CLS > 0.1 (poor)
- Image "pops in" with sudden size change
- Zoom/pan gets disrupted when high-res loads mid-interaction

**Phase to address:**
Phase 1 (Photo Viewer Modal) - Must design modal container with fixed dimensions from start

---

### Pitfall 8: Admin Editing Conflicts When Multiple Admins Edit Same Project Simultaneously

**What goes wrong:**
Two admins open /admin for same project. Admin A reorders images, Admin B adds a new image. Admin A saves layout, Admin B saves layout. Admin A's changes are lost because B's save overwrites. No conflict detection, no merging, no "refresh to see updates" warning.

**Why it happens:**
Optimistic UI updates local state immediately, sends save to server, but doesn't fetch latest server state before saving. No lock mechanism, no conflict resolution, no real-time sync. Supabase doesn't prevent concurrent writes to same document without explicit handling.

**How to avoid:**
- Add version/timestamp field to layout: `updated_at` timestamp
- On save, include current version in request: `POST /api/layout { layout, expectedVersion: currentVersion }`
- Server rejects if version mismatch: return conflict error with new version
- On conflict, show modal: "Project updated by Admin B. Your changes were not saved. Reload to see new version?"
- Alternative: Use Supabase real-time subscriptions to sync layout across admins in real-time
- For MVP: Implement simple pessimistic locking: `/admin/[projectId]` locks project for 60s on edit start
- Test: Open 2 browser windows, edit in both, verify conflict is detected and user is warned

**Warning signs:**
- Users report their edits disappearing randomly
- No warning when multiple admins edit same project
- Version control shows multiple conflicting saves
- Drizzle ORM has no optimistic locking on layout table
- Database audit log shows last-write-wins clobbering

**Phase to address:**
Phase 3 (Grid Editor) - Implement version checking or real-time sync before shipping multi-admin support

---

### Pitfall 9: Next.js Image Loader Caching Issues with Cloudinary URL Params

**What goes wrong:**
Admin changes image crop/transformation in Cloudinary editor. Image on site shows old version for hours even though URL changed. This is because:
1. next/Image caches based on URL
2. Cloudinary supports URL parameters (w_400, q_80, crop params)
3. When admin updates crop, they generate new Cloudinary URL
4. Browser/CDN might cache old URL variant
5. User sees stale image

**Why it happens:**
next/Image with Cloudinary loader relies on URL stability. If you reuse same image with different parameters, caching headers conflict. Cloudinary URLs with transformation parameters are not always treated as cache-busting by browsers.

**How to avoid:**
- Use Cloudinary public ID as cache key, not transformation params: `cloudinary.com/.../portfolio/v1234567890/image-name`
- Include version number in URL: Add `v={timestamp}` when image is modified
- Set explicit cache-control headers on Cloudinary URLs: `Cache-Control: max-age=86400, public` (1 day)
- For admin edits: Invalidate browser cache by changing public_id version or adding `?bust={Date.now()}`
- Test: Edit image in Cloudinary, verify new version shows within 10 seconds on portfolio
- Document for admins: "After editing image in Cloudinary, refresh page to see changes"

**Warning signs:**
- Admin edits image but portfolio shows old version
- Stale images persist for hours despite URL changes
- Multiple admins see different image versions (cache coherency issue)
- Cloudinary admin shows new image but portfolio shows old
- Users report seeing "wrong" images in portfolio

**Phase to address:**
Phase 2-3 (Admin Integration) - Must plan cache invalidation strategy before shipping admin edits

---

### Pitfall 10: 12-Column Grid Editor Breaking at Different Breakpoints

**What goes wrong:**
Grid layout looks perfect at 1200px (12 columns visible), but on 768px tablet it's broken:
- 6 columns visible but grid config says 12
- Images overlap or disappear
- Responsive breakpoints not defined
- Admin creates layout assuming desktop but mobile users see garbage

**Why it happens:**
Developer defines 12-column layout for desktop but doesn't configure responsive breakpoints for tablet/mobile. CSS Grid or react-grid-layout requires explicit breakpoint configs. Without them, layout doesn't adapt, just scales and breaks.

**How to avoid:**
- Define breakpoints before building editor:
  - Desktop: 1200px+ = 12 cols
  - Tablet: 768px-1199px = 8 cols
  - Mobile: <768px = 4 cols
- If using react-grid-layout, provide breakpoint config: `{ lg: { cols: 12 }, md: { cols: 8 }, sm: { cols: 4 } }`
- Editor UI should show current breakpoint and allow previewing each: "Editing: Desktop (1200px) [Preview Tablet] [Preview Mobile]"
- Test: Arrange grid on desktop, resize window, verify layout doesn't break
- Warn admin: "Layout adjusted for tablet. [Edit tablet layout separately]"

**Warning signs:**
- Layout perfect on desktop but broken on mobile
- Grid items overlap on tablet
- Admin complains layout looks different on phone
- No way to edit mobile-specific layout
- Responsive test in DevTools shows misaligned grid
- React-grid-layout config has no `breakpoints` property

**Phase to address:**
Phase 3 (Grid Editor) - Must design for mobile-first or define all breakpoints before shipping

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline zoom handler without library | Saves 30KB bundle | Mobile pinch broken, iOS crashes, pan jerky, maintenance nightmare | Never - use react-zoom-pan-pinch v3+ |
| Admin overlay always server-rendered | Simpler code, less state | Hydration errors, flashes, slow page loads | Never - must use dynamic import with ssr:false |
| Load all images in zoom modal on open | Preload ensures fast viewing | Wastes 10MB+ bandwidth for users who close modal, gallery unbrowsable on slow networks | Only MVP: Add lazy loading before Phase 2 |
| Store grid layout only in React state | Fast dev iteration | Lost on refresh, conflicts on multi-admin, no undo/redo | MVP only - add DB persistence before Phase 3 |
| Next.js Image with unoptimized=true for Cloudinary | Avoids loader config | Double file size, misses WebP/AVIF, higher bandwidth costs | Never - use Cloudinary loader config instead |
| No cache busting for edited images | Simple implementation | Users see stale images for hours, admin feels broken | Never - add version param or timestamp to URLs |
| Grid editor preview only on desktop | Saves dev time | Mobile breaks, support headache, low star reviews | Never - test all breakpoints during development |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Cloudinary Images** | Using next/Image with unoptimized={true} or no loader | Configure Cloudinary loader, let next/Image handle responsive sizing, use URL params for transformations |
| **Cloudinary Uploads** | Uploading full 4K images and scaling in browser | Pre-process on upload: resize to web-friendly sizes (max 2048px), create thumbnails, store metadata |
| **Supabase Auth** | Checking auth during server render for /admin overlay | Never check auth on server. Use dynamic import with ssr:false, defer to useEffect on client |
| **Supabase Session** | Not refreshing session when returning from backgrounded tab | Listen to visibilitychange event, call refreshSession on visibility change |
| **Drizzle ORM** | Not saving grid layout state to database | Add layout_config JSON column to projects table, implement auto-save API endpoint |
| **Vercel Deployment** | Cloudinary URLs with no custom domain going through Vercel | Configure Cloudinary as allowed image domain in next.config.ts to get optimizations |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Load all images on project page** | Page takes 15+ seconds with 20 images, 30+ seconds with 50 | Lazy load below-fold images, load only 5-8 hero images on initial page, defer rest | > 10 images per page on 4G network |
| **Zoom modal preloads all full-res** | 50MB+ transfer just to open modal on slow network, gallery unusable on mobile | Load thumbnail on modal open, load high-res on demand when user tries to zoom | > 5 photos in modal on mobile |
| **Polling Supabase for auth every 5s** | Battery drain on mobile, 1000+ requests/hour from stale tabs | Subscribe via real-time or listen to visibilitychange, only refresh on tab switch | Deployed to production with 1000+ users |
| **Grid layout recalculated on every drag** | Drag/pan becomes laggy after 100+ images in grid, janky interaction | Memoize grid calculations, use React.memo on grid items, virtualize off-screen items | > 50 images in editable grid |
| **Database queries for layout on every page load** | N+1 query problem, 500ms+ load time for admin | Cache layout in React Query or SWR with 60s stale-while-revalidate, revalidate on edit | > 50 concurrent editors |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Admin overlay visible in public view (CSS display:none only) | Attacker inspects HTML/CSS, sees admin controls, replays auth token | Always require server-side auth check, never hide sensitive UI with CSS, disable overlay in public route entirely |
| Cloudinary signed uploads without expiration | Token can be replayed indefinitely, attacker can upload malicious images | Always set `timestamp` and `upload_signature` in Cloudinary upload, set expiration window (5 min), verify on server |
| Layout editor accepts any JSON without validation | Attacker sends malformed grid config, breaks page or causes XSS | Validate layout JSON shape server-side, use Zod/TypeScript for schema validation, reject invalid configs |
| Assuming client-side check prevents unauthorized grid edits | Attacker sends grid save request without being admin | Always verify user has admin role in API handler before accepting layout change, use RLS in Supabase |
| Storing image transformation params in plain text | User can manipulate URL params to access unauthorized crops/filters | If images are restricted, never trust URL params—verify access server-side, use signed URLs from Cloudinary |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **Zoom modal has no keyboard controls** | Keyboard users can't navigate, accessibility score tanks | Add arrow keys for prev/next, Escape to close, Enter to zoom, make all controls keyboard-accessible |
| **No visual feedback during image load** | User thinks image is broken if loading takes 2+ seconds, frustration | Show placeholder/skeleton, progress bar, "Loading high-resolution version..." |
| **Grid editor doesn't show pixel dimensions** | Admin guesses image sizes, can't align properly, layout looks amateurish | Show size preview: "1024x768 @ 300 DPI", allow manual dimension input, show grid guide overlay |
| **No undo/redo in grid editor** | User accidentally deletes row, has to rebuild from scratch, frustration | Implement undo/redo stack, show history panel on sidebar, allow restore to any past state |
| **Admin overlay covers part of page** | Can't see what's being edited, confusing for first-time users | Make overlay semi-transparent or slide-in panel, allow dragging to different position, provide overlay hide/show toggle |
| **Zoom modal closes on any click outside** | User clicks to pan image, accidentally clicks edge, modal closes, frustration | Close only on Escape or explicit close button, require deliberate action to dismiss |
| **Portfolio scales images but doesn't show file sizes** | Users on mobile see "Loading..." for 30 seconds, think site is broken | Show estimated data usage: "This image: 500KB", warn on slow networks: "Over mobile? This might take a minute" |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Zoom modal:** Often missing touch pinch support on iOS—verify pinch works on real iPhone in Safari, not just DevTools
- [ ] **Admin overlay:** Often missing SSR guard—verify it doesn't render on server (check Network tab, HTML source should have no admin UI)
- [ ] **Grid editor:** Often missing responsive breakpoint definitions—verify layout doesn't break on tablet (768px) and mobile (320px)
- [ ] **Image lazy loading:** Often forgot below-the-fold—verify 2nd & 3rd project pages have `loading="lazy"`, page FCP < 2s on 4G
- [ ] **Layout persistence:** Often missing auto-save indicator—verify "Saving..." appears, "Saved" confirmation after API responds
- [ ] **Cloudinary integration:** Often missing cache busting—verify edited image shows new version within 10s, not stale for hours
- [ ] **Supabase auth in overlay:** Often missing session refresh on tab switch—verify /admin still works after 30s in another tab
- [ ] **Grid item positioning:** Often missing explicit width/height—verify no layout shift when image loads, CLS = 0
- [ ] **Zoom library cleanup:** Often forgot event listener removal—verify scrolling smooth after closing modal, no sluggishness
- [ ] **Mobile zoom:** Often works on desktop only—verify two-finger pinch works on actual Android and iOS devices

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Hydration mismatch deployed to prod | MEDIUM | Revert to previous version, add ssr:false to overlay component, re-deploy, monitor for errors |
| Grid layouts corrupted (malformed JSON) | MEDIUM | Write migration: query all layouts, validate JSON, log corrupted IDs, manual fix via Drizzle Studio, re-save |
| Users lost grid edits due to no persistence | HIGH | Restore from database backup if available, otherwise communicate data loss, re-implement with auto-save |
| Zoom modal memory leak causing OOM | MEDIUM | Identify missing cleanup in useEffect, add AbortController cleanup, deploy hotfix, monitor memory usage |
| Image cache coherency (serving stale images) | LOW | Clear CDN cache via Cloudinary API, add cache busting param, document for future edits |
| Admin conflict overwrites (concurrent edits) | HIGH | Implement version checking, revert to earlier version, notify admins of conflict, ask one to re-apply changes |
| Mobile zoom broken on iOS (pinch doesn't work) | MEDIUM | Upgrade react-zoom-pan-pinch to v3.7.0+, test on real device, consider double-tap alternative, re-deploy |
| Grid layout breaks on responsive (tablet) | LOW | Add breakpoint definitions, test on all screen sizes, re-deploy with breakpoint config |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Hydration mismatch with admin overlay | Phase 2 | Test: Disable JavaScript, load /admin, verify no admin UI in HTML source; enable JS, verify admin overlay appears |
| Image zoom modal not cleaning up listeners | Phase 1 | Test: DevTools, open modal, close modal, verify no event listeners remain; scroll page, verify no zoom interference |
| Zoom component not working on mobile pinch | Phase 1 | Test: Real iOS + Android device, pinch to zoom, drag to pan, verify smooth and responsive (not just DevTools) |
| Admin overlay route not respecting page visibility | Phase 2 | Test: Open /admin, switch tabs 30+ seconds, return, verify controls responsive; check no "hanging" auth calls |
| Cloudinary images not lazy-loading | Phase 1 & 3 | Test: DevTools Network, scroll slowly, verify images load only when visible; check Lighthouse FCP < 2s on 4G |
| Grid layout editor not persisting | Phase 3 | Test: Edit grid, refresh page, verify layout persists; check database has saved config with version field |
| Incorrect image sizing causing CLS | Phase 1 | Test: DevTools, open zoom modal, check CLS = 0 in Performance tab; image should not "pop" or shift on load |
| Multi-admin conflicts on simultaneous edits | Phase 3 | Test: 2 browser windows editing same project, save both, verify conflict detected and user warned (not silent overwrite) |
| Cloudinary cache issues with URL params | Phase 2 | Test: Edit image in Cloudinary, refresh portfolio, verify new version shows within 10 seconds (not hours) |
| 12-column grid breaking at breakpoints | Phase 3 | Test: Arrange desktop layout, resize to 768px, verify layout adapts correctly; test at 320px mobile, verify 4-column layout |

---

## Sources

- [Next.js Hydration Error Documentation](https://nextjs.org/docs/messages/react-hydration-error)
- [Advanced Next.js Hydration Troubleshooting — Sentry](https://sentry.io/answers/hydration-error-nextjs/)
- [Next.js Hydration Errors in 2026: Real Causes and Prevention — Medium](https://medium.com/@blogs-world/next-js-hydration-errors-in-2026-the-real-causes-fixes-and-prevention-checklist-4a8304d53702)
- [Image Zoom with React and Next.js — Medium](https://medium.com/@thomasaugot/adding-zoom-functionality-to-an-image-viewer-in-react-next-js-4621be8eb770)
- [Yet Another React Lightbox — Modern React Lightbox Library](https://yet-another-react-lightbox.com/)
- [Comparing Top React Lightbox Libraries — LogRocket Blog](https://blog.logrocket.com/comparing-the-top-3-react-lightbox-libraries/)
- [React Zoom Pan Pinch Issues — GitHub](https://github.com/BetterTyped/react-zoom-pan-pinch/issues)
- [How to Add Zoom, Pan, and Pinch to React Apps — LogRocket Blog](https://blog.logrocket.com/adding-zoom-pan-pinch-react-web-apps/)
- [Supabase Auth Troubleshooting Documentation](https://supabase.com/docs/guides/auth/troubleshooting)
- [Supabase Auth Session Issues — GitHub](https://github.com/supabase/auth-js/issues/762)
- [How to Optimize Images in Next.js: 2026 Performance Guide — Request Metrics](https://requestmetrics.com/web-performance/high-performance-images/)
- [Image Lazy Loading for Photography Sites — Imagely](https://www.imagely.com/lazy-loading/)
- [Cloudinary and Next.js Image Optimization](https://next.cloudinary.dev/guides/image-optimization)
- [Next.js Image Component Performance and Core Web Vitals — Pagepro](https://pagepro.co/blog/nextjs-image-component-performance-cwv/)
- [React Grid Layout — GitHub](https://github.com/react-grid-layout/react-grid-layout)
- [CSS Grid Common Mistakes Unveiled — Pixel Free Studio](https://blog.pixelfreestudio.com/why-your-css-grid-isnt-working-common-mistakes-unveiled/)
- [Memory Leaks in React Applications — FreeCodeCamp](https://www.freecodecamp.org/news/fix-memory-leaks-in-react-apps/)
- [React Memory Leak Warning — Sentry](https://sentry.io/answers/how-to-fix-react-warning-can-t-perform-a-react-state-update-on-an-unmounted-component/)
- [useEffect Cleanup Function Examples — React.wiki](https://react.wiki/hooks/use-effect-cleanup/)
- [Application State Management with React — Kent C. Dodds](https://kentcdodds.com/blog/application-state-management-with-react)
- [Modal State Management Patterns — Medium](https://medium.com/@renanolovics/mastering-modals-in-react-simplified-ui-enhancement-23bd060f387e)
- [React State Management Libraries 2026 — Syncfusion](https://www.syncfusion.com/blogs/post/react-state-management-libraries)

---

*Pitfalls research for: Next.js photography portfolio with admin CMS*

*Researched: 2026-02-12*
