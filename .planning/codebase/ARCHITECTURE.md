# Architecture

**Analysis Date:** 2026-03-10

## Pattern Overview

**Overall:** Next.js full-stack application with client-side state management and server-side data persistence. The app follows a layered architecture separating UI components, business logic (editor state), data access, and API routes.

**Key Characteristics:**
- Next.js App Router with route groups for site and editor contexts
- Client-side state management via Zustand for editor operations
- Server-side rendering for public portfolio pages
- API routes for backend operations (layout persistence, image uploads)
- Clear separation between rendering logic and editing logic
- Zod schema validation for type-safe data structures

## Layers

**Presentation Layer (Components):**
- Purpose: Render UI and handle user interactions
- Location: `src/components/`, `src/core/editor/`, `src/core/renderer/`
- Contains: React components, page templates, UI elements
- Depends on: Zustand store, core utilities, external libraries (framer-motion, dnd-kit)
- Used by: Next.js page routes

**Business Logic Layer (Editor State):**
- Purpose: Manage editor state, item operations, and save coordination
- Location: `src/core/editor/store.ts`
- Contains: Zustand store with actions for layout manipulation (add, remove, move items)
- Depends on: Layout types, fetch API for persistence
- Used by: Editor components (`EditorCanvas`, `Toolbar`, `PropertiesPanel`)

**Data Access Layer (Database):**
- Purpose: Abstract database operations and fallback to sample data
- Location: `src/lib/db/`
- Contains: Database client initialization, layout queries/mutations, schema definitions
- Depends on: Drizzle ORM, PostgreSQL connection
- Used by: API routes, server components

**API Layer (Route Handlers):**
- Purpose: Expose HTTP endpoints for client operations and external integrations
- Location: `src/app/api/`
- Contains: GET/PUT handlers for layouts, signature generation for image uploads
- Depends on: Database layer, Cloudinary integration, authentication
- Used by: Client-side fetch calls, image upload workflow

**Infrastructure Layer (Utilities):**
- Purpose: Encapsulate external service integrations and cross-cutting concerns
- Location: `src/lib/auth/`, `src/lib/cloudinary.ts`, `src/lib/storage/`
- Contains: Authentication helpers, image CDN configuration, service integration
- Depends on: External SDKs (Supabase, Cloudinary)
- Used by: API routes, middleware, components

**Rendering Engine:**
- Purpose: Decouple layout data structure from visual representation
- Location: `src/core/renderer/`
- Contains: Generic item renderer, layout type definitions, sample layouts
- Depends on: Next.js Image, Framer Motion
- Used by: Both site pages (view mode) and editor canvas (edit mode)

**Layout Engine:**
- Purpose: Calculate masonry grid positions for responsive layout
- Location: `src/core/layout-engine/index.ts`
- Contains: Column-based height calculation for masonry algorithm
- Depends on: Layout item types
- Used by: CSS masonry classes (not directly invoked)

## Data Flow

**Portfolio View (Public):**

1. User visits public site (e.g., `/`)
2. `src/app/(site)/page.tsx` (server component) calls `getLayoutBySlug("home")`
3. `src/lib/db/layouts.ts` queries PostgreSQL via Drizzle or returns sample layout
4. `Renderer` component receives layout object, renders items in masonry grid with Framer Motion
5. Images loaded from Cloudinary via secure URL stored in `Layout.items[].src`

**Editor View (Protected):**

1. User navigates to `/editor` → caught by middleware (`middleware.ts`)
2. Middleware checks Supabase auth, redirects to `/login` if unauthenticated
3. `src/app/(editor)/editor/page.tsx` (client component) mounts
4. Fetches current layout from `/api/layouts/[slug]` on mount
5. Initializes Zustand store with layout data
6. User interactions trigger store actions (add, remove, move, update items)
7. Store tracks `hasUnsavedChanges` state
8. User clicks "Guardar" → triggers `saveLayout()` which:
   - PUTs to `/api/layouts/[slug]` with updated layout
   - API handler identifies removed images
   - Deletes removed images from Cloudinary via `deleteImage()`
   - Upserts layout to PostgreSQL
   - Sets `hasUnsavedChanges` to false

**Image Upload Workflow:**

1. User selects file in Properties Panel
2. `handleImageUpload()` POSTs to `/api/upload` with folder name
3. Backend calls `generateSignature()` using Cloudinary credentials
4. Returns signature, timestamp, API key, cloud name
5. Client-side code POSTs directly to Cloudinary API with credentials
6. Cloudinary returns `secure_url` and `public_id`
7. `updateItem()` stores both in layout item
8. Image persists when layout is saved

**State Management:**

- **EditorState** (Zustand): Holds current layout, selected item ID, unsaved changes flag
- **Actions** in store: `setLayout`, `selectItem`, `updateItem`, `addItem`, `removeItem`, `moveItem`, `saveLayout`
- **Server state**: PostgreSQL through Drizzle ORM
- **Transient state**: File uploads handled as fetch requests with form data

## Key Abstractions

**Layout Object:**
- Purpose: Unified data structure for both viewing and editing
- Examples: `src/core/renderer/types.ts`, `src/core/renderer/sample-layout.ts`
- Pattern: Discriminated union of `LayoutImage | LayoutText | LayoutSpacer` items
- Validation: Zod schemas ensure type safety

**LayoutItem Types:**
- `image`: Stores `src`, `alt`, `width`, `height`, `caption`, `publicId`
- `text`: Stores `content`
- `spacer`: Stores `height`
- All items have `id` (nanoid) and `type` discriminator

**Renderer Component:**
- Purpose: Single component renders both view and edit modes
- Pattern: `mode` prop toggles between "view" and "edit"
- In edit mode: adds selection borders, click handlers for PropertiesPanel
- In view mode: plain masonry display with Framer Motion animations

**Editor Store:**
- Purpose: Single source of truth for all editor state
- Pattern: Zustand store with getter/setter pattern
- Invariants: `layout.items` immutable updates via map/filter, nanoid for new items

## Entry Points

**Root Entry Point:**
- Location: `src/app/layout.tsx`
- Triggers: All requests
- Responsibilities: Sets up HTML document, fonts, global metadata

**Public Site Entry Point:**
- Location: `src/app/(site)/layout.tsx`
- Triggers: Requests to `/` and public routes
- Responsibilities: Renders sidebar navigation, responsive layout, main content area

**Editor Entry Point:**
- Location: `src/app/(editor)/layout.tsx` + `src/app/(editor)/editor/page.tsx`
- Triggers: Requests to `/editor/*` (caught by middleware)
- Responsibilities: Initialize editor state, render editor UI (canvas, toolbar, properties)

**Authentication Entry Point:**
- Location: `middleware.ts`
- Triggers: All requests matching `/editor/:path*`
- Responsibilities: Check Supabase session, redirect to `/login` if unauthenticated

**API Entry Points:**
- `GET /api/layouts/[slug]`: Fetch layout by slug
- `PUT /api/layouts/[slug]`: Save layout changes
- `POST /api/upload`: Generate Cloudinary upload signature

## Error Handling

**Strategy:** Try-catch with fallback to sample data for DB operations; user-facing alerts for API errors

**Patterns:**

1. **Database errors** (`src/lib/db/layouts.ts`):
   ```typescript
   try {
     const result = await db.select().from(layouts)...
   } catch (error) {
     console.warn("Database error, falling back to sample layout:", error);
     return sampleLayout; // Graceful fallback
   }
   ```

2. **API errors** (`src/core/editor/store.ts`):
   ```typescript
   catch (error) {
     console.error("Error saving layout:", error);
     alert("Error al guardar los cambios"); // User feedback
   }
   ```

3. **Image deletion errors** (`src/app/api/layouts/[slug]/route.ts`):
   ```typescript
   catch (err) {
     console.error(`Failed to delete image ${item.publicId}:`, err);
     // Continue even if delete fails
   }
   ```

4. **Validation errors** (Zod in API routes):
   ```typescript
   if (error instanceof z.ZodError) {
     return NextResponse.json({ error: (error as any).errors }, { status: 400 });
   }
   ```

## Cross-Cutting Concerns

**Logging:** Console-based via `console.log`, `console.warn`, `console.error`

**Validation:** Zod schemas at API boundaries and in database access layer
- Layout schema in `src/core/renderer/types.ts`
- Validated in `upsertLayout()` before database write
- Validated in API route PUT handler

**Authentication:** Supabase auth via middleware
- Server-side: `createSupabaseServerClient()` in `src/lib/auth/server.ts`
- Client-side: `createBrowserClient()` in `src/lib/auth/browser.ts`
- Middleware enforces auth for `/editor/*` routes
- Auth state managed by Supabase SSR library

**Drag & Drop:** @dnd-kit library with sortable context
- Used in `EditorCanvas` for reordering items
- Integration points: `DndContext`, `SortableContext`, `SortableItem` wrapper
- Updates store via `moveItem()` action

**Image Optimization:** Next.js Image component with optional CDN loader
- Client-side image loader in `src/lib/storage/image-loader.ts`
- Supports external URLs (Cloudinary) and internal CDN
- Configurable via `NEXT_PUBLIC_CDN_URL` env var

---

*Architecture analysis: 2026-03-10*
