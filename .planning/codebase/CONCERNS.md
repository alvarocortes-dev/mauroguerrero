# Codebase Concerns

**Analysis Date:** 2026-03-10

## Tech Debt

**Hardcoded Placeholder Image in Editor:**
- Issue: Editor store uses hardcoded Unsplash URL as default image when adding new image items
- Files: `src/core/editor/store.ts` (lines 55)
- Impact: All new images start with same placeholder URL instead of blank/null state; creates inconsistent behavior for different users
- Fix approach: Change placeholder to empty string or null; let UI handle showing placeholder state

**Unimplemented Contact Form Backend:**
- Issue: ContactForm component has only client-side simulation (2-second timeout) with no server integration
- Files: `src/components/ContactForm.tsx` (lines 14-23)
- Impact: Form never actually sends data; no emails delivered; users get false success confirmation
- Fix approach: Implement actual backend API endpoint to handle form submission, validate, and send via email service

**Missing Layout Fetch Error Handling:**
- Issue: Editor page falls back to sample layout on ANY fetch error without distinguishing between 404 (new layout) and actual failures
- Files: `src/app/(editor)/editor/page.tsx` (lines 19-29)
- Impact: Silent failures make debugging difficult; real errors go unnoticed; no user feedback on what went wrong
- Fix approach: Add explicit error states; log/report errors; show different UX for "layout not found" vs "server error"

**Manual Slug/Layout Mismatch Validation:**
- Issue: PUT endpoint manually checks slug match instead of relying on type system
- Files: `src/app/api/layouts/[slug]/route.ts` (lines 25-27)
- Impact: Runtime check that should be compile-time safe; creates validation layer that can be bypassed
- Fix approach: Use path parameter validation at type level; extract slug from validated params

**Database Connection Singleton with No Reset:**
- Issue: Database client initialized once globally with no way to close or reset connection
- Files: `src/lib/db/client.ts` (lines 4-16)
- Impact: Connection pooling issues on hot reloads; memory leaks in development; connection limits in serverless
- Fix approach: Use Drizzle's connection pool management; implement proper cleanup on server shutdown

**Missing File Upload Validation:**
- Issue: Image upload handler accepts any file type and size without validation
- Files: `src/core/editor/PropertiesPanel.tsx` (lines 15-64)
- Impact: Users can upload non-image files; large files consume bandwidth/storage; no file type enforcement
- Fix approach: Add client-side type/size checks; add server-side validation in /api/upload route

**Empty Environment Variable Fallbacks:**
- Issue: Browser and server auth clients use empty strings when env vars missing
- Files: `src/lib/auth/browser.ts` (lines 5-6), `middleware.ts` (lines 13-14)
- Impact: Silent failures to initialize Supabase; auth checks appear to pass but don't actually work
- Fix approach: Throw explicit errors on missing required env vars at startup; validate config before using

**Unsafe Image URL Update:**
- Issue: PropertiesPanel allows direct URL edit without validation or sanitization
- Files: `src/core/editor/PropertiesPanel.tsx` (lines 87-92)
- Impact: Users can paste malicious URLs; no format validation; broken URLs silently fail
- Fix approach: Validate URLs before saving; show preview; handle CORS errors gracefully

## Known Bugs

**Cloudinary Image Deletion Doesn't Block Save:**
- Symptoms: When removing images, deletion from Cloudinary can fail but save still succeeds, leaving orphaned files
- Files: `src/app/api/layouts/[slug]/route.ts` (lines 42-54)
- Trigger: Remove an image from layout and save when Cloudinary is down/slow
- Workaround: Manual cleanup of orphaned images via Cloudinary dashboard

**Image Dimension Casting Loss:**
- Symptoms: Entering decimal/invalid numbers in width/height fields gets silently converted to 0
- Files: `src/core/editor/PropertiesPanel.tsx` (lines 129-148)
- Trigger: Type "abc" in width field and save
- Workaround: Only enter valid positive integers

**Missing "No Layout" State:**
- Symptoms: Editor shows "Loading..." indefinitely if layout fetch fails completely
- Files: `src/app/(editor)/editor/page.tsx` (line 46)
- Trigger: Visit /editor when API is down or database is unavailable
- Workaround: Hard refresh or clear browser cache

## Security Considerations

**API Upload Signature Exposed to Client:**
- Risk: Cloudinary API key and timestamp/signature sent to browser; anyone can forge upload requests
- Files: `src/app/api/upload/route.ts` (line 9), `src/core/editor/PropertiesPanel.tsx` (lines 20-38)
- Current mitigation: Cloudinary API key is "public" (scoped) but still unnecessary exposure
- Recommendations: Implement signed server-side upload URLs; validate file ownership before allowing; add rate limiting

**Missing CSRF Protection on Layout Updates:**
- Risk: PUT endpoint accepts requests from any origin without token validation
- Files: `src/app/api/layouts/[slug]/route.ts` (lines 16-72)
- Current mitigation: Middleware auth check, but insufficient for state-changing operations
- Recommendations: Add CSRF tokens; validate Origin header; implement double-submit cookie

**No Input Sanitization on Text Content:**
- Risk: User-entered text content stored and rendered without escaping
- Files: `src/core/renderer/Renderer.tsx` (lines 56-68), stored via `src/lib/db/layouts.ts`
- Current mitigation: React auto-escapes by default in JSX, but only text not rich content
- Recommendations: If adding rich text editing, sanitize HTML; validate content length limits

**Unencrypted Layout Data in Database:**
- Risk: All layout JSON stored plaintext in database; includes image URLs and metadata
- Files: `src/lib/db/schema.ts` (line 7), `src/lib/db/layouts.ts` (line 42)
- Current mitigation: Access requires authentication; database connection over encrypted channel
- Recommendations: For MVP acceptable, but consider field-level encryption for future phases

**Weak Password Requirements:**
- Risk: Supabase auth used but no password policy enforcement visible
- Files: `src/app/(editor)/login/page.tsx` (entire file)
- Current mitigation: Supabase default rules apply
- Recommendations: Document Supabase auth config; add password strength indicators on signup

## Performance Bottlenecks

**Synchronous Image Delete on Every Save:**
- Problem: Layout update waits for ALL image deletions to complete sequentially/in parallel Promise.all
- Files: `src/app/api/layouts/[slug]/route.ts` (lines 42-54)
- Cause: Cloudinary API calls block layout save; if one delete is slow, entire request times out
- Improvement path: Queue image deletes asynchronously; return layout save immediately; handle cleanup in background job

**No Pagination for Large Layouts:**
- Problem: Editor loads entire layout (all items) at once; no lazy loading or virtualization in canvas
- Files: `src/app/(editor)/editor/page.tsx` (entire editor), `src/core/renderer/Renderer.tsx` (line 90)
- Cause: Rendering 100+ items causes frame drops and lag
- Improvement path: Implement viewport-based rendering; load items on scroll; use react-virtuoso or similar

**Unoptimized Image Rendering:**
- Problem: Next.js Image component used correctly but no size optimization or format variants
- Files: `src/core/renderer/Renderer.tsx` (lines 39-45)
- Cause: Large original images served without resizing; no WebP fallback
- Improvement path: Use Cloudinary transformations in URL; add responsive sizes to Next.js Image

**Missing Database Query Optimization:**
- Problem: getLayoutBySlug fetches all fields including large JSON blob; no projection or caching
- Files: `src/lib/db/layouts.ts` (lines 14-17)
- Cause: Every page load refetches from database; Cloudinary metadata included in stored JSON
- Improvement path: Add query caching; store only essential fields; cache layout metadata separately

**No Request Deduplication:**
- Problem: If user rapidly clicks "add image" or saves, multiple simultaneous requests fire
- Files: `src/core/editor/PropertiesPanel.tsx` (lines 15-64), `src/core/editor/store.ts` (lines 123-146)
- Cause: No request cancellation or debouncing; store doesn't prevent concurrent saves
- Improvement path: Add debounce to save action; cancel pending uploads on new request; use optimistic updates

## Fragile Areas

**Editor Store State Synchronization:**
- Files: `src/core/editor/store.ts` (entire file)
- Why fragile: Store and API can get out of sync; no conflict resolution if user edits while save is pending
- Safe modification: Always set isSaving state; disable UI during save; refetch layout after save confirms
- Test coverage: No tests exist for save/update race conditions or concurrent edits

**Complex Image Deletion Logic:**
- Files: `src/app/api/layouts/[slug]/route.ts` (lines 29-54)
- Why fragile: Identifies removed images by comparing ID sets; breaks if item IDs can be null/undefined
- Safe modification: Add strict null checks; validate that publicId exists before deleting; log all deletions
- Test coverage: No tests for deletion flow; edge case of missing publicIds untested

**Drag-and-Drop Layout:**
- Files: `src/core/editor/EditorCanvas.tsx` (entire file), `src/core/editor/store.ts` (lines 97-119)
- Why fragile: Relies on exact array index matching between activeId/overId; complex dnd-kit integration
- Safe modification: Add type-safe item tracking; validate indexes before arrayMove; add drop event validation
- Test coverage: No tests for drop failures; no error boundary for drag context

**Database Connection Fallback:**
- Files: `src/lib/db/layouts.ts` (lines 7-11, 30-32)
- Why fragile: Returns sample layout when DB is down/unavailable; users won't know data isn't persisted
- Safe modification: Always throw explicit error; never silently fall back; let caller decide handling
- Test coverage: No tests for database unavailable scenario

**Zustand Store with No Persistence:**
- Files: `src/core/editor/store.ts` (entire file)
- Why fragile: All editor state lost on page refresh; unsaved changes disappear silently
- Safe modification: Add localStorage hydration; show "unsaved changes" indicator; prompt on unload
- Test coverage: No tests for state persistence or loss scenarios

## Test Coverage Gaps

**No Unit Tests for Core Editor Logic:**
- What's not tested: Store reducers (addItem, removeItem, moveItem, updateItem, saveLayout)
- Files: `src/core/editor/store.ts`
- Risk: Changes to store logic break silently; race conditions in saveLayout undetected
- Priority: High - store is core to application functionality

**No Integration Tests for API Routes:**
- What's not tested: Layout fetch/save endpoints; image deletion logic; Cloudinary integration
- Files: `src/app/api/layouts/[slug]/route.ts`, `src/app/api/upload/route.ts`
- Risk: API changes break silently; database failures not caught; orphaned images created
- Priority: High - API is critical data path

**No E2E Tests for Editor Workflows:**
- What's not tested: Complete workflows (add item, edit properties, save, reload); image upload flow
- Files: Editor pages and components
- Risk: Full workflows fail but individual parts test fine; regression on future changes
- Priority: Medium - core user workflows untested

**No Tests for Database Layer:**
- What's not tested: upsertLayout, getLayoutBySlug with various inputs; error handling
- Files: `src/lib/db/layouts.ts`
- Risk: Database errors undetected; data corruption scenarios not caught
- Priority: Medium - data integrity impacts

**No Tests for Auth/Middleware:**
- What's not tested: Middleware redirects; protected route access; session validation
- Files: `middleware.ts`, `src/app/(editor)/login/page.tsx`
- Risk: Auth bypass or lockouts undetected; silent failures
- Priority: Medium-High - security relevant

---

*Concerns audit: 2026-03-10*
