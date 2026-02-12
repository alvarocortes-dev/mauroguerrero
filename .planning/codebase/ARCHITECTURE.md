# Architecture

**Analysis Date:** 2026-02-12

## Pattern Overview

**Overall:** Next.js 16 Full-Stack Web Application with Client-Side Editor Interface

**Key Characteristics:**
- Dual-application pattern: Public portfolio site + Private editor interface in same codebase
- Client-server separation using Next.js route groups `(site)` and `(editor)`
- State management via Zustand for editor operations
- REST API layer for layout persistence and file uploads
- Real-time drag-and-drop UI with dnd-kit and Framer Motion animations
- PostgreSQL database with Drizzle ORM for layout storage
- Cloudinary integration for image hosting and management

## Layers

**Presentation Layer (Client):**
- Purpose: Render UI components, handle user interactions, drag-and-drop operations
- Location: `src/app/(site)`, `src/app/(editor)`, `src/components`, `src/core/editor`, `src/core/renderer`
- Contains: React components, styled with Tailwind CSS, animations with Framer Motion
- Depends on: Zustand store, API routes, next/image for image optimization
- Used by: Browser (client-side rendering and SSR)

**Business Logic Layer (State Management):**
- Purpose: Manage editor state, layout data, UI selections, save operations
- Location: `src/core/editor/store.ts`
- Contains: Zustand store with actions for item manipulation (add, remove, update, move)
- Depends on: API routes for persistence, type definitions from renderer
- Used by: Editor components (EditorCanvas, Toolbar, PropertiesPanel)

**Renderer Layer:**
- Purpose: Convert layout data structures into visual components with mode-specific rendering
- Location: `src/core/renderer/Renderer.tsx`, `src/core/renderer/types.ts`
- Contains: Generic `renderItem()` function supporting "view" and "edit" modes, Zod schema validation
- Depends on: Framer Motion for animations, Next Image, type system
- Used by: Both site and editor (site for display, editor for canvas)

**Layout Engine Layer:**
- Purpose: Calculate masonry grid positions for responsive layout
- Location: `src/core/layout-engine/index.ts`
- Contains: `buildMasonryPositions()` algorithm for multi-column layout
- Depends on: LayoutItem types
- Used by: Renderer components (CSS handles actual positioning)

**API Layer:**
- Purpose: Handle HTTP requests for layout CRUD and file upload coordination
- Location: `src/app/api/layouts/[slug]/route.ts`, `src/app/api/upload/route.ts`
- Contains: GET/PUT endpoints for layouts, POST for upload signatures
- Depends on: Database layer, Cloudinary utilities, Zod validation
- Used by: Client components via fetch calls

**Data Access Layer:**
- Purpose: Database operations and external service integrations
- Location: `src/lib/db/client.ts`, `src/lib/db/layouts.ts`, `src/lib/db/schema.ts`, `src/lib/cloudinary.ts`
- Contains: Drizzle ORM setup, SQL queries, Cloudinary SDK configuration
- Depends on: PostgreSQL, Cloudinary API, environment variables
- Used by: API routes, editor components

**Authentication Layer:**
- Purpose: Supabase client initialization for future auth integration
- Location: `src/lib/auth/server.ts`, `src/lib/auth/browser.ts`
- Contains: SSR-safe Supabase client factories
- Depends on: Supabase SDK, cookies
- Used by: Currently not actively used (placeholder for future implementation)

## Data Flow

**View Layout (Public Site):**

1. User navigates to `/` (home page via `src/app/(site)/page.tsx`)
2. Server-side: `getLayoutBySlug("home")` queries database or returns sample layout
3. Server passes layout data to Renderer component
4. Renderer converts Layout object to visual DOM with mode="view"
5. Browser receives pre-rendered HTML with images (optimized via next/image)

**Edit Layout (Editor Interface):**

1. User navigates to `/editor` (editor page via `src/app/(editor)/editor/page.tsx`)
2. Client-side: `useEffect` fetches `/api/layouts/home`
3. API returns layout JSON, client initializes Zustand store
4. EditorCanvas renders items via SortableContext (dnd-kit)
5. User drags, selects, or modifies items
6. Changes update Zustand state immediately (optimistic updates)
7. User clicks "Guardar" button in Toolbar
8. `saveLayout()` POSTs to `/api/layouts/{slug}` with full layout
9. API validates with Zod, upserts to database, syncs Cloudinary deletions
10. Client marks `hasUnsavedChanges` as false

**Image Upload Flow:**

1. User selects image in PropertiesPanel
2. Client POSTs to `/api/upload` requesting signature with folder parameter
3. API calls `generateSignature()` from Cloudinary utilities
4. API returns timestamp, signature, credentials
5. Client POSTs multipart form to Cloudinary directly (`https://api.cloudinary.com/v1_1/.../upload`)
6. Cloudinary returns secure_url and public_id
7. Client updates layout item with image URL and publicId via store
8. On next save, publicId is stored in database for cleanup tracking

**State Management:**

- All editor state centralized in `useEditorStore()` (Zustand)
- Layout object holds full structure of all items
- selectedId tracks which item is being edited
- isSaving and hasUnsavedChanges control UI state (save button disabled state)
- Store mutations are synchronous (immutable updates)
- No optimistic reversions—assumes API always succeeds currently
- Sample layout serves as fallback if database unavailable

## Key Abstractions

**LayoutItem Type Union:**
- Purpose: Represent any content block in the layout
- Defined in: `src/core/renderer/types.ts`
- Pattern: Discriminated union with Zod schemas (layoutImageSchema, layoutTextSchema, layoutSpacerSchema)
- Usage: Type-safe rendering logic switches on item.type

**Layout Container:**
- Purpose: Group items with metadata (id, slug, title, updatedAt)
- Defined in: `src/core/renderer/types.ts`
- Pattern: Single source of truth for all layout data
- Usage: Stored as JSON in database, passed through API, managed by store

**renderItem Function:**
- Purpose: Polymorphic rendering with mode awareness
- Defined in: `src/core/renderer/Renderer.tsx`
- Pattern: Factory function returning React elements with conditional styling
- Usage: Consumed by both view renderer and editor canvas

**EditorStore Actions:**
- Purpose: Encapsulate all state mutations for layout editing
- Pattern: Zustand store with named action methods (addItem, moveItem, updateItem, etc.)
- Usage: Called from UI components to maintain consistent state

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: All route requests
- Responsibilities: Set metadata, apply root fonts, suppress hydration warnings

**Site Layout Group:**
- Location: `src/app/(site)/layout.tsx`
- Triggers: Routes under `(site)` group
- Responsibilities: Render sidebar, mobile menu, main content area with max-width constraints

**Editor Layout Group:**
- Location: `src/app/(editor)/layout.tsx`
- Triggers: Routes under `(editor)` group
- Responsibilities: Apply editor-specific styling (neutral-50 background)

**Home Page (Public):**
- Location: `src/app/(site)/page.tsx`
- Triggers: GET `/`
- Responsibilities: Fetch "home" layout, render with Renderer in "view" mode

**Editor Page:**
- Location: `src/app/(editor)/editor/page.tsx`
- Triggers: GET `/editor`
- Responsibilities: Initialize store with fetched layout, render editor UI with EditorCanvas, Toolbar, PropertiesPanel

**Layouts API Route:**
- Location: `src/app/api/layouts/[slug]/route.ts`
- Triggers: GET/PUT `/api/layouts/{slug}`
- Responsibilities: Fetch layout by slug, validate and persist layout updates, orchestrate Cloudinary cleanup

**Upload API Route:**
- Location: `src/app/api/upload/route.ts`
- Triggers: POST `/api/upload`
- Responsibilities: Generate and return Cloudinary upload signature with credentials

## Error Handling

**Strategy:** Graceful degradation with fallback to sample layout, client-side console logging, user-facing alerts for critical failures

**Patterns:**

- Database errors in `getLayoutBySlug()` fall back to `sampleLayout` without throwing
- API errors in `saveLayout()` catch and alert user: "Error al guardar los cambios"
- Image upload errors caught in PropertiesPanel with try-catch and alert
- Cloudinary deletion errors logged and swallowed (save continues)
- Zod validation errors in API routes return 400 with error details
- Unhandled errors in API routes return 500 with generic message

## Cross-Cutting Concerns

**Logging:** Console.error and console.warn for development debugging, no centralized logging infrastructure

**Validation:** Zod schemas in `src/core/renderer/types.ts` validate all layout data at API boundaries and store mutations

**Authentication:** Supabase clients initialized but not integrated; authentication logic not yet implemented

**Styling:** Tailwind CSS with custom CSS variables for theming, applied globally in `src/app/globals.css`

**Image Optimization:** Next.js Image component with custom loader from `src/lib/storage/image-loader.ts` supporting CDN prefix or passthrough for HTTP URLs

**Data Persistence:** REST-based with no real-time sync; client-side unsaved changes flag manages dirty state

---

*Architecture analysis: 2026-02-12*
