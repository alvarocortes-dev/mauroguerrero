# Codebase Concerns

**Analysis Date:** 2026-02-12

## Tech Debt

**Non-functional ContactForm:**
- Issue: ContactForm component simulates email sending with a 2-second setTimeout instead of actually sending messages
- Files: `src/components/ContactForm.tsx`
- Impact: Contact form appears to work but discards all user input - no messages are captured or sent
- Fix approach: Implement actual backend API endpoint to handle form submission, validate inputs server-side, and integrate with email service (SendGrid, Resend, etc.)

**Incomplete Editor Implementation:**
- Issue: EditorPage contains TODO comment and uses hardcoded slug "home" instead of dynamic routing
- Files: `src/app/(editor)/editor/page.tsx`
- Impact: Only one layout can be edited, no support for multiple pages or dynamic layout selection
- Fix approach: Implement dynamic routing via URL parameters, add slug selection UI, implement logic to distinguish between creating new layouts vs editing existing ones

**Missing Upload API Endpoint:**
- Issue: PropertiesPanel references a needed API endpoint for upload management ("I need an API endpoint for getting the upload URL" - inline comment)
- Files: `src/core/editor/PropertiesPanel.tsx` (line 4)
- Impact: Current implementation works but bypasses potential centralized upload management and security layers
- Fix approach: Create dedicated upload management API with request validation, rate limiting, and proper error handling before delegating to Cloudinary

**Database Connection Fallback Too Permissive:**
- Issue: Database client silently returns sample layout when DATABASE_URL is missing - no error indication to user
- Files: `src/lib/db/client.ts`, `src/lib/db/layouts.ts`
- Impact: In production, missing environment variable could cause data loss (user saves are silently discarded) without visible error
- Fix approach: Log clear warnings for missing DATABASE_URL in production, consider fail-fast approach or require explicit configuration

---

## Known Bugs

**Auth State Lost Between Requests:**
- Symptoms: Login may appear successful but middleware might not recognize session due to cookie synchronization timing
- Files: `middleware.ts`, `src/lib/auth/browser.ts`, `src/lib/auth/server.ts`
- Trigger: Multiple rapid requests after login or page refresh immediately after authentication
- Workaround: Manual page refresh or retry login attempt usually resolves it

**Image Upload Public ID Not Always Captured:**
- Symptoms: Images may be uploaded to Cloudinary but `publicId` field not stored in database, breaking deletion on future edits
- Files: `src/app/api/layouts/[slug]/route.ts`, `src/core/editor/PropertiesPanel.tsx`
- Trigger: When updateItem receives upload response but optional `publicId` field is undefined
- Workaround: Manually track Cloudinary public IDs outside the system or re-upload images

**Unsaved Changes Not Persisted on Disconnect:**
- Symptoms: If user loses connection, layout changes made since last save are lost with no recovery mechanism
- Files: `src/core/editor/store.ts`
- Trigger: Network failure or tab close without saving
- Workaround: Implement periodic autosave or IndexedDB backup before save attempt

---

## Security Considerations

**Cloudinary Credentials Exposed in Client Code:**
- Risk: API key and signature are generated and visible in browser network requests without encryption or additional validation
- Files: `src/core/editor/PropertiesPanel.tsx`, `src/app/api/upload/route.ts`, `src/lib/cloudinary.ts`
- Current mitigation: Cloudinary API key is restricted to API key (not secret), but folder parameter is user-controllable
- Recommendations:
  - Validate folder parameter against whitelist of allowed layouts
  - Add rate limiting to `/api/upload` endpoint
  - Consider moving image upload entirely server-side to avoid exposing Cloudinary credentials
  - Add request authentication check to `/api/upload` endpoint

**Missing Authentication on API Routes:**
- Risk: `/api/layouts/[slug]/route.ts` has no authentication checks - any user can update any layout
- Files: `src/app/api/layouts/[slug]/route.ts`
- Current mitigation: Middleware protects `/editor` routes, but API routes are unprotected
- Recommendations:
  - Add Supabase auth verification to PUT and GET endpoints
  - Validate user owns the requested layout before allowing updates
  - Add audit logging for layout modifications

**Environment Variables Missing in Deployment:**
- Risk: Empty string fallbacks (`process.env.X ?? ""`) hide missing critical config
- Files: `src/lib/auth/server.ts`, `src/lib/auth/browser.ts`, `middleware.ts`
- Current mitigation: App falls back to empty configs which causes API failures
- Recommendations:
  - Validate required env vars at startup with clear error messages
  - Use Zod schema for environment configuration
  - Fail fast in development if critical vars are missing

**Insufficient Error Handling in API Routes:**
- Risk: Error details sometimes logged to console and returned to client (e.g., Zod validation errors)
- Files: `src/app/api/layouts/[slug]/route.ts` (line 61-64)
- Current mitigation: Generic "Internal Server Error" text, but Zod errors array could leak implementation details
- Recommendations:
  - Sanitize all error responses to avoid exposing internal validation structure
  - Log detailed errors server-side only
  - Return generic error messages to client

---

## Performance Bottlenecks

**No Pagination or Virtualization for Large Layouts:**
- Problem: EditorCanvas renders all layout items without virtualization - performance degrades with hundreds of items
- Files: `src/core/editor/EditorCanvas.tsx`
- Cause: Simple `.map()` rendering without react-virtuoso (already in dependencies)
- Improvement path:
  - Implement windowing with react-virtuoso for edit view
  - Consider lazy rendering for items outside viewport
  - Add performance monitoring for render times

**Unnecessary Image Reloads:**
- Problem: Images in editor re-request from Cloudinary on every selection/deselection due to key prop changes
- Files: `src/core/renderer/Renderer.tsx`
- Cause: `key={item.id}` causes unmount/remount on selection changes
- Improvement path: Decouple visual selection state from component key structure

**No Image Optimization:**
- Problem: Cloudinary URLs used directly without transformation params (resize, quality, format)
- Files: `src/core/editor/PropertiesPanel.tsx`, `src/core/renderer/Renderer.tsx`
- Cause: User can set arbitrary image URLs without optimization
- Improvement path:
  - Add Cloudinary transformation params to image URLs
  - Implement responsive image sizing with srcset
  - Add quality/format negotiation based on browser

**Database Queries Not Optimized:**
- Problem: Full layout data stored as JSONB, entire object fetched and serialized on every request
- Files: `src/lib/db/layouts.ts`, `src/lib/db/schema.ts`
- Cause: Simple single-table schema without indexing strategy
- Improvement path:
  - Add database indexes on slug column
  - Consider breaking out frequently-accessed fields (title, slug) into separate columns
  - Implement query result caching in `/api/layouts/[slug]`

---

## Fragile Areas

**Editor State Store with No Undo/Redo:**
- Files: `src/core/editor/store.ts`
- Why fragile: State mutations are immediate with no history tracking - accidental deletions are permanent until page reload
- Safe modification:
  - Wrap store mutations with history stack (implement Ctrl+Z)
  - Add confirmation dialogs before destructive operations
  - Persist draft state to localStorage
- Test coverage: No test file exists for store logic

**Image Deletion Without Verification:**
- Files: `src/app/api/layouts/[slug]/route.ts`
- Why fragile: Images are deleted from Cloudinary before database confirms save - orphaned images if save fails
- Safe modification:
  - Defer Cloudinary deletions until after database transaction completes
  - Add transaction rollback if Cloudinary delete fails
  - Implement soft delete with cleanup job
- Test coverage: No tests for image deletion flow

**Drag-and-Drop Without Persistence:**
- Files: `src/core/editor/EditorCanvas.tsx`, `src/core/editor/store.ts`
- Why fragile: Item reordering doesn't persist until manual save - easy to lose item order on unexpected navigation
- Safe modification:
  - Add auto-save on reorder completion
  - Show unsaved indicator more prominently
  - Warn user before navigation with unsaved changes
- Test coverage: No tests for drag-and-drop reordering

**Untyped Form Data in ContactForm:**
- Files: `src/components/ContactForm.tsx`
- Why fragile: Form values not captured in state, only submitted in event handler
- Safe modification:
  - Add form state management with validation schema
  - Implement proper error handling and display
  - Validate inputs before submission
- Test coverage: No tests for form submission

---

## Scaling Limits

**Single Editor Instance Only:**
- Current capacity: One user can edit "home" layout at a time
- Limit: No concurrent editing, no support for multiple layouts, no user workspace management
- Scaling path:
  - Implement layout ownership and multi-user support
  - Add layout versioning and collaboration features
  - Build layout templates system

**Cloudinary Storage Without Limits:**
- Current capacity: Unlimited image uploads per layout
- Limit: No quota enforcement, storage costs scale linearly with user uploads
- Scaling path:
  - Add per-user/per-layout upload quota
  - Implement image deduplication across layouts
  - Add storage monitoring and alerts

**No Analytics or Monitoring:**
- Current capacity: Zero instrumentation
- Limit: Cannot diagnose performance issues or user behavior
- Scaling path:
  - Add error tracking (Sentry, LogRocket)
  - Implement performance monitoring (Web Vitals, API response times)
  - Add user analytics to understand editor usage patterns

---

## Dependencies at Risk

**Babel React Compiler (Experimental):**
- Risk: `babel-plugin-react-compiler` v1.0.0 is experimental and may have breaking changes
- Impact: Automatic memoization optimization could behave unexpectedly or break with future React versions
- Migration plan: Monitor React releases, consider removing if causes performance regressions or memory issues

**Next.js 16.1.6 Fast-Moving:**
- Risk: Near-latest Next.js version, API stability not guaranteed
- Impact: App router API changes could require significant refactoring
- Migration plan: Pin version until major version is stable, implement feature detection for breaking changes

---

## Missing Critical Features

**No Auth UI for Sign-Up:**
- Problem: Only login page exists, no registration flow for new users
- Blocks: New users cannot access editor, team expansion impossible
- Fix approach: Implement signup page with email verification, integrate with Supabase auth

**No Layout Versioning:**
- Problem: No way to revert to previous layout versions
- Blocks: Accidental deletions/overwrites cannot be recovered
- Fix approach: Implement layout version history, add restore functionality

**No Image Management Dashboard:**
- Problem: No way to see all uploaded images, manage storage, or bulk delete
- Blocks: Users cannot audit what images are being stored and billed
- Fix approach: Create image management UI, add bulk operations

**No Export/Import:**
- Problem: Layouts are locked to this editor, no portability
- Blocks: Users cannot migrate to other tools or backup layouts
- Fix approach: Implement JSON/HTML export, drag-and-drop import

---

## Test Coverage Gaps

**Editor Store Logic Untested:**
- What's not tested: Item add/remove/update/move operations, state transitions
- Files: `src/core/editor/store.ts`
- Risk: State mutations could fail silently or produce unexpected results when refactoring
- Priority: High - core functionality depends on store correctness

**API Route Error Handling Untested:**
- What's not tested: Invalid payloads, missing database, Cloudinary failures, race conditions
- Files: `src/app/api/layouts/[slug]/route.ts`, `src/app/api/upload/route.ts`
- Risk: Production errors will leak implementation details or cause data loss
- Priority: High - direct user data impact

**Authentication Flows Untested:**
- What's not tested: Login/logout, middleware auth checks, token expiration, concurrent requests
- Files: `middleware.ts`, `src/lib/auth/server.ts`, `src/lib/auth/browser.ts`
- Risk: Auth bypass vulnerabilities or session state corruption could occur
- Priority: High - security-critical

**Image Upload End-to-End Untested:**
- What's not tested: Signature generation, Cloudinary API success/failure, metadata capture, cleanup on failure
- Files: `src/core/editor/PropertiesPanel.tsx`, `src/lib/cloudinary.ts`
- Risk: Images could be uploaded but metadata lost, orphaned Cloudinary files accumulate
- Priority: High - data consistency impact

**Responsive Layout Untested:**
- What's not tested: Mobile vs desktop rendering, drag-and-drop on touch devices, modal behavior on small screens
- Files: All components
- Risk: Mobile users experience broken UI or editor functionality
- Priority: Medium - user experience impact

---

*Concerns audit: 2026-02-12*
