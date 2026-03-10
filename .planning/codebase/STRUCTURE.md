# Codebase Structure

**Analysis Date:** 2026-03-10

## Directory Layout

```
mauroguerrero/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (site)/                   # Public portfolio routes
│   │   │   ├── layout.tsx            # Site layout with sidebar
│   │   │   └── page.tsx              # Home page
│   │   ├── (editor)/                 # Protected editor routes
│   │   │   ├── layout.tsx            # Editor layout wrapper
│   │   │   ├── editor/
│   │   │   │   └── page.tsx          # Main editor page
│   │   │   └── login/
│   │   │       └── page.tsx          # Login page
│   │   ├── api/                      # API route handlers
│   │   │   ├── layouts/[slug]/
│   │   │   │   └── route.ts          # GET/PUT layout endpoints
│   │   │   └── upload/
│   │   │       └── route.ts          # POST upload signature
│   │   ├── globals.css               # Global styles (Tailwind)
│   │   └── layout.tsx                # Root layout
│   │
│   ├── components/                   # Shared UI components
│   │   ├── ContactForm.tsx
│   │   ├── CreditsContent.tsx
│   │   ├── MobileMenu.tsx
│   │   ├── Modal.tsx
│   │   ├── SidebarContent.tsx
│   │   └── ThemeToggle.tsx
│   │
│   ├── core/                         # Core business logic
│   │   ├── editor/                   # Editor UI and state
│   │   │   ├── EditorCanvas.tsx      # Drag-drop canvas with masonry
│   │   │   ├── PropertiesPanel.tsx   # Item properties and upload
│   │   │   ├── SortableItem.tsx      # Wrapper for dnd-kit
│   │   │   ├── Toolbar.tsx           # Add item buttons + save
│   │   │   └── store.ts              # Zustand editor state
│   │   │
│   │   ├── renderer/                 # Layout rendering engine
│   │   │   ├── Renderer.tsx          # Generic layout renderer
│   │   │   ├── types.ts              # Zod layout schemas
│   │   │   └── sample-layout.ts      # Default layout data
│   │   │
│   │   └── layout-engine/            # Masonry algorithm
│   │       └── index.ts              # Masonry position calculator
│   │
│   └── lib/                          # Utilities and integrations
│       ├── auth/
│       │   ├── server.ts             # Supabase server client
│       │   └── browser.ts            # Supabase browser client
│       │
│       ├── db/
│       │   ├── client.ts             # Drizzle connection pool
│       │   ├── layouts.ts            # Layout queries/mutations
│       │   └── schema.ts             # Drizzle table definitions
│       │
│       ├── storage/
│       │   └── image-loader.ts       # Next.js image loader
│       │
│       └── cloudinary.ts             # Image service helpers
│
├── public/                           # Static assets
│   ├── avatar.jpg
│   └── photos/
│
├── drizzle/                          # Database migrations
│
├── .planning/                        # Project planning docs
│
├── middleware.ts                     # Auth middleware for /editor
├── next.config.ts                    # Next.js configuration
├── tailwind.config.js                # Tailwind CSS config
├── tsconfig.json                     # TypeScript config
├── eslint.config.mjs                 # ESLint configuration
├── drizzle.config.ts                 # Drizzle kit config
└── package.json                      # Dependencies

```

## Directory Purposes

**`src/app/(site)/`:**
- Purpose: Public portfolio pages visible to all users
- Contains: Page templates, site-specific layouts
- Key files: `page.tsx` (home), `layout.tsx` (sidebar + responsive wrapper)
- Route pattern: `/` and other public pages

**`src/app/(editor)/`:**
- Purpose: Protected editor interface for authenticated users
- Contains: Editor pages, login redirect
- Key files: `editor/page.tsx` (main editor), `layout.tsx` (editor wrapper)
- Route pattern: `/editor/*` (protected by middleware)

**`src/app/api/`:**
- Purpose: Backend API endpoints
- Contains: Route handlers for REST operations
- Key files: `layouts/[slug]/route.ts` (CRUD), `upload/route.ts` (signature generation)

**`src/components/`:**
- Purpose: Reusable UI components shared across site
- Contains: Page sections, modals, navigation, theme toggle
- Used by: Both site and editor layouts

**`src/core/editor/`:**
- Purpose: Editor-specific logic and UI
- Contains: State management, canvas rendering, properties panel, toolbar
- Key abstractions: `EditorCanvas` (drag-drop), `store.ts` (Zustand), `SortableItem` (dnd-kit wrapper)
- Not reused in site pages

**`src/core/renderer/`:**
- Purpose: Layout rendering engine (used in both view and edit modes)
- Contains: Generic `Renderer` component, type definitions, sample data
- Key abstraction: Zod schemas for type safety
- Reused in: Site pages (view mode), editor canvas (edit mode)

**`src/core/layout-engine/`:**
- Purpose: Calculate masonry grid layout
- Contains: Column-based height calculation
- Note: Currently used as reference; actual layout via CSS masonry classes

**`src/lib/auth/`:**
- Purpose: Supabase authentication helpers
- Contains: Server-side and browser-side client factories
- Server: `createSupabaseServerClient()` for server components/middleware
- Browser: `createBrowserClient()` for client components

**`src/lib/db/`:**
- Purpose: Database abstraction and queries
- Contains: Drizzle connection, CRUD operations, schema definitions
- Key patterns: Null check for missing `DATABASE_URL`, fallback to sample data

**`src/lib/storage/`:**
- Purpose: Image optimization and CDN integration
- Contains: Next.js image loader for CDN rewriting
- Supports: Cloudinary URLs, internal CDN via `NEXT_PUBLIC_CDN_URL`

**`src/lib/cloudinary.ts`:**
- Purpose: Cloudinary image service integration
- Contains: Upload signature generation, image deletion
- Credentials: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root HTML document setup
- `src/app/(site)/page.tsx`: Public home page
- `src/app/(editor)/editor/page.tsx`: Editor UI entry point
- `middleware.ts`: Auth guard for editor routes

**Configuration:**
- `tsconfig.json`: Path alias `@/*` → `src/*`
- `next.config.ts`: Next.js settings
- `tailwind.config.js`: Tailwind CSS customization
- `drizzle.config.ts`: Database migration config
- `package.json`: Dependencies and scripts

**Core Logic:**
- `src/core/editor/store.ts`: Zustand editor state machine
- `src/core/renderer/types.ts`: Zod layout schemas (single source of truth)
- `src/lib/db/layouts.ts`: Database access functions
- `src/app/api/layouts/[slug]/route.ts`: Layout persistence API

**Testing:**
- No test files present (not yet configured)

## Naming Conventions

**Files:**
- `*.tsx`: React components (pages, layout, UI)
- `*.ts`: Utilities, types, business logic
- `route.ts`: API route handlers (Next.js pattern)
- `store.ts`: Zustand state stores
- `types.ts`: Type definitions and schemas
- `layout.tsx`: Layout wrapper components (Next.js App Router)

**Directories:**
- PascalCase for feature folders: `(site)`, `(editor)`, `EditorCanvas.tsx` folder NOT used
- kebab-case not used; feature-based organization preferred
- Grouped by concern: `lib/auth/`, `lib/db/`, `core/editor/`, `core/renderer/`

**Exports:**
- Named exports for utilities: `export const getDb = () => ...`
- Default exports for page/layout components: `export default function HomePage() {}`
- Barrel files NOT used; direct imports preferred: `import { useEditorStore } from "@/core/editor/store.ts"`

**Components:**
- PascalCase: `EditorCanvas.tsx`, `PropertiesPanel.tsx`
- Export const: `export const EditorCanvas = () => ...`
- Props interface inline or exported separately

## Where to Add New Code

**New Feature (e.g., Gallery view):**
- Primary code: `src/app/(site)/gallery/page.tsx` (page) + `src/components/GalleryView.tsx` (component)
- Shared logic: `src/lib/gallery.ts` if database queries needed
- API: `src/app/api/galleries/[slug]/route.ts` if backend needed
- Tests: Create `*.test.tsx` or `*.test.ts` files co-located

**New Component/Module (e.g., RichTextEditor):**
- Implementation: `src/components/RichTextEditor.tsx` or `src/core/editor/RichTextEditor.tsx`
- Types: Define inline or in component file
- Styling: Use Tailwind classes inline (no separate CSS files)

**Utilities:**
- Shared helpers: `src/lib/utils.ts` (create if doesn't exist)
- Service integrations: `src/lib/[service-name].ts` (e.g., `cloudinary.ts`, `auth/`)
- Database queries: `src/lib/db/[table-name].ts` (e.g., `layouts.ts`)

**API Endpoints:**
- Add to `src/app/api/[resource]/[slug]/route.ts`
- Pattern: `[resource]` = plural resource name, `[slug]` = dynamic segment
- Import handlers from `src/lib/db/` or `src/lib/[service].ts`

## Special Directories

**`drizzle/`:**
- Purpose: Database migrations
- Generated: Yes (via `drizzle-kit`)
- Committed: Yes
- How to update: Modify `src/lib/db/schema.ts`, then run `drizzle-kit migrate`

**`public/`:**
- Purpose: Static assets (images, fonts)
- Generated: No
- Committed: Yes
- Access: `/avatar.jpg` (becomes `public/avatar.jpg`)

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (via `npm run build`)
- Committed: No (in `.gitignore`)

**`.planning/`:**
- Purpose: Project planning and analysis documents
- Generated: Semi (by GSD tools)
- Committed: Yes
- Contents: Roadmaps, requirements, codebase analysis

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in `.gitignore`)

## Code Organization Patterns

**Server Components vs Client Components:**
- Server components by default in Next.js 13+
- Use `"use client"` directive only in interactive components
- Examples:
  - Server: `src/app/(site)/page.tsx` (calls `getLayoutBySlug()`)
  - Client: `src/core/editor/EditorCanvas.tsx` (uses Zustand, dnd-kit)

**Module Boundaries:**
- `src/core/editor/*` = Editor-only, not used in site
- `src/core/renderer/*` = Shared between site and editor
- `src/components/*` = Shared UI across all pages
- `src/lib/*` = Pure utilities, safe to import anywhere

**Import Organization:**
- Path alias `@/` for internal imports: `import { Layout } from "@/core/renderer/types"`
- External libraries first: `import React from "react"`
- Internal utilities second: `import { useEditorStore } from "@/core/editor/store"`
- No circular dependencies enforced by file structure

---

*Structure analysis: 2026-03-10*
