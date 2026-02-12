# Codebase Structure

**Analysis Date:** 2026-02-12

## Directory Layout

```
mauroguerrero/
├── .planning/                          # GSD planning documents
│   ├── config.json                     # GSD configuration
│   └── codebase/                       # Architecture analysis output
├── drizzle/                            # Drizzle ORM migrations and snapshots
│   └── meta/                           # Migration metadata
├── public/                             # Static assets served directly
│   └── avatar.jpg                      # Profile image
├── src/
│   ├── app/                            # Next.js app directory with route groups
│   │   ├── layout.tsx                  # Root layout (fonts, metadata)
│   │   ├── globals.css                 # Global Tailwind styles
│   │   ├── favicon.ico                 # Browser tab icon
│   │   ├── (site)/                     # Public portfolio site routes
│   │   │   ├── layout.tsx              # Site layout with sidebar
│   │   │   └── page.tsx                # Home page (/)
│   │   ├── (editor)/                   # Private editor interface routes
│   │   │   ├── layout.tsx              # Editor layout (background styling)
│   │   │   ├── editor/
│   │   │   │   └── page.tsx            # Main editor page (/editor)
│   │   │   └── login/
│   │   │       └── page.tsx            # Login page (not implemented)
│   │   └── api/                        # API routes (serverless functions)
│   │       ├── layouts/
│   │       │   └── [slug]/
│   │       │       └── route.ts        # GET/PUT layout by slug
│   │       └── upload/
│   │           └── route.ts            # POST signature for image upload
│   ├── components/                     # Reusable React components (site-wide)
│   │   ├── SidebarContent.tsx          # Navigation and profile sidebar
│   │   ├── MobileMenu.tsx              # Mobile navigation drawer
│   │   ├── Modal.tsx                   # Generic modal wrapper
│   │   ├── ContactForm.tsx             # Contact form modal content
│   │   ├── CreditsContent.tsx          # Credits modal content
│   │   └── ThemeToggle.tsx             # Light/dark mode toggle
│   ├── core/                           # Core business logic and rendering
│   │   ├── renderer/                   # Layout rendering engine
│   │   │   ├── Renderer.tsx            # Component that renders layout
│   │   │   ├── types.ts                # Zod schemas and TypeScript types
│   │   │   └── sample-layout.ts        # Default layout with sample images
│   │   ├── editor/                     # Editor-specific components and state
│   │   │   ├── store.ts                # Zustand store for editor state
│   │   │   ├── EditorCanvas.tsx        # Drag-and-drop canvas with dnd-kit
│   │   │   ├── SortableItem.tsx        # Wrapper for draggable items
│   │   │   ├── Toolbar.tsx             # Fixed bottom toolbar with action buttons
│   │   │   └── PropertiesPanel.tsx     # Right panel for item properties
│   │   └── layout-engine/              # Layout calculation algorithms
│   │       └── index.ts                # Masonry position calculation
│   └── lib/                            # Utility functions and external integrations
│       ├── auth/                       # Authentication utilities
│       │   ├── server.ts               # SSR-safe Supabase client factory
│       │   └── browser.ts              # Client-side Supabase client factory
│       ├── db/                         # Database utilities
│       │   ├── client.ts               # Drizzle ORM connection initialization
│       │   ├── schema.ts               # Database table definitions
│       │   └── layouts.ts              # Query functions (getLayoutBySlug, upsertLayout)
│       ├── storage/                    # File storage utilities
│       │   └── image-loader.ts         # Next.js image loader for CDN support
│       └── cloudinary.ts               # Cloudinary SDK configuration and utilities
├── middleware.ts                       # Next.js middleware (currently empty placeholder)
├── drizzle.config.ts                   # Drizzle ORM configuration
├── next.config.ts                      # Next.js configuration
├── tsconfig.json                       # TypeScript configuration
├── package.json                        # Dependencies and scripts
├── package-lock.json                   # Dependency lock file
├── CHANGELOG.md                        # Version history
└── README.md                           # Project documentation
```

## Directory Purposes

**src/app:**
- Purpose: Next.js app directory containing all routes, layouts, and API endpoints
- Contains: Route files (page.tsx, layout.tsx, route.ts), styling (globals.css)
- Key files: `layout.tsx` (root), `(site)/page.tsx` (home), `(editor)/editor/page.tsx` (editor)

**src/app/(site):**
- Purpose: Public portfolio site routes accessible to all users
- Contains: Site-specific layout and pages
- Key files: `layout.tsx` (sidebar layout), `page.tsx` (home page with layout display)

**src/app/(editor):**
- Purpose: Private editor interface routes for content creation
- Contains: Editor-specific layout and editor page
- Key files: `editor/page.tsx` (main editor), `login/page.tsx` (authentication placeholder)

**src/app/api:**
- Purpose: Backend API endpoints for data operations
- Contains: Route handlers for layout management and file uploads
- Key files: `layouts/[slug]/route.ts` (CRUD), `upload/route.ts` (signature generation)

**src/components:**
- Purpose: Reusable UI components shared across site and editor
- Contains: Sidebar, navigation, modals, theme toggle
- Key files: `SidebarContent.tsx` (navigation), `Modal.tsx` (modal base component)

**src/core:**
- Purpose: Core business logic separated from UI presentation
- Contains: Rendering engine, editor state, layout algorithms

**src/core/renderer:**
- Purpose: Convert layout data structures to visual components
- Contains: Renderer component, type definitions, sample data
- Key files: `types.ts` (Zod schemas, TypeScript types), `Renderer.tsx` (rendering logic)

**src/core/editor:**
- Purpose: Editor-specific components and state management
- Contains: Zustand store, editor canvas, toolbar, properties panel
- Key files: `store.ts` (state), `EditorCanvas.tsx` (draggable canvas)

**src/core/layout-engine:**
- Purpose: Layout calculation algorithms (currently unused masonry positioning)
- Contains: Grid position calculations
- Key files: `index.ts` (buildMasonryPositions function)

**src/lib:**
- Purpose: Utility functions and external service integrations
- Contains: Database, authentication, file storage, CDN loading

**src/lib/db:**
- Purpose: Database access layer using Drizzle ORM
- Contains: Connection setup, schema definition, query functions
- Key files: `client.ts` (connection), `schema.ts` (tables), `layouts.ts` (queries)

**src/lib/auth:**
- Purpose: Supabase authentication setup (placeholder for future use)
- Contains: Server-side and client-side Supabase client factories
- Key files: `server.ts` (SSR), `browser.ts` (CSR)

**src/lib/storage:**
- Purpose: File storage and CDN integration
- Contains: Image loader for Next.js Image component
- Key files: `image-loader.ts` (custom loader)

**drizzle:**
- Purpose: Database migration artifacts generated by Drizzle Kit
- Contains: Migration snapshots and metadata
- Generated: Yes
- Committed: Yes

**public:**
- Purpose: Static assets served directly by Next.js
- Contains: Images, icons, fonts
- Key files: `avatar.jpg` (profile image)

**.planning:**
- Purpose: GSD (Getting Stuff Done) planning documents and configuration
- Contains: Architecture analysis, task planning, configuration
- Generated: Yes (by GSD commands)
- Committed: Yes

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout for all pages (fonts, metadata, HTML setup)
- `src/app/(site)/page.tsx`: Public home page route
- `src/app/(editor)/editor/page.tsx`: Editor interface route
- `next.config.ts`: Next.js configuration for React Compiler and custom image loader

**Configuration:**
- `tsconfig.json`: TypeScript compilation settings with path alias `@/*` → `./src/*`
- `next.config.ts`: Custom image loader configuration, React Compiler enablement
- `drizzle.config.ts`: Database migration configuration
- `middleware.ts`: Next.js middleware entry point (currently unused)

**Core Logic:**
- `src/core/editor/store.ts`: Complete editor state management with Zustand
- `src/core/renderer/types.ts`: Zod schemas for all layout item types and validation
- `src/core/renderer/Renderer.tsx`: Polymorphic rendering function supporting view/edit modes
- `src/lib/db/layouts.ts`: Database query functions with fallback to sample layout

**Testing:**
- No test files present in codebase

**Database:**
- `src/lib/db/schema.ts`: Single table `layouts` with JSONB data column
- `drizzle/meta/_journal.json`: Migration journal

## Naming Conventions

**Files:**
- React components: PascalCase, single responsibility (e.g., `EditorCanvas.tsx`)
- Pages: `page.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Utility modules: camelCase, descriptive (e.g., `image-loader.ts`, `cloudinary.ts`)
- Schema/type files: `types.ts`, `schema.ts`

**Directories:**
- Next.js route groups: Parentheses wrapped (e.g., `(site)`, `(editor)`)
- Feature directories: lowercase (e.g., `renderer`, `editor`, `layout-engine`)
- Utility directories: lowercase plural when containing multiple modules (e.g., `components`, `lib`)

**Components:**
- Exported as named exports: `export const ComponentName`
- Hook names: `use` prefix (e.g., `useEditorStore`)
- Props interfaces: `{ComponentName}Props` (not used; inline types preferred)

**Functions:**
- PascalCase for React components
- camelCase for utility functions (e.g., `buildMasonryPositions`, `getLayoutBySlug`, `generateSignature`)
- Async functions for API/database operations

**Types:**
- Type names: PascalCase (e.g., `Layout`, `LayoutItem`)
- Union types: Zod `.union()` with discriminated literals
- Generic parameters: Single letter or descriptive (e.g., `T`, `Props`)

## Where to Add New Code

**New Feature (e.g., new layout item type):**
- Add schema variant to: `src/core/renderer/types.ts` (new Zod schema)
- Add rendering logic to: `src/core/renderer/Renderer.tsx` (new case in `renderItem()`)
- Add item creation to: `src/core/editor/store.ts` (new branch in `addItem()`)
- Add properties UI to: `src/core/editor/PropertiesPanel.tsx` (new conditional block)
- Tests: None (no test infrastructure exists)

**New Page/Route:**
- Server-rendered page: Create file in `src/app/` with appropriate route group
- API endpoint: Create file in `src/app/api/` with `route.ts` name
- Both should follow Next.js conventions with proper segment organization

**New Component (site-wide):**
- Shared reusable components: `src/components/{ComponentName}.tsx`
- Editor-only components: `src/core/editor/{ComponentName}.tsx`
- Renderer-only components: Part of `src/core/renderer/Renderer.tsx`

**Utilities/Helpers:**
- Database helpers: `src/lib/db/{module}.ts`
- Auth helpers: `src/lib/auth/{module}.ts`
- External service integration: `src/lib/{service-name}.ts` (e.g., `cloudinary.ts`)
- General utilities: Create new file in appropriate `src/lib/` subdirectory

**New Database Table:**
- Define in: `src/lib/db/schema.ts` (add to exports)
- Create query file: `src/lib/db/{entity}.ts` (e.g., `users.ts`)
- Run migration: `drizzle-kit push` (updates `drizzle/meta/`)

## Special Directories

**node_modules:**
- Purpose: Installed dependencies from npm
- Generated: Yes
- Committed: No (excluded via .gitignore)

**.next:**
- Purpose: Next.js build output and type definitions
- Generated: Yes (by `npm run build` or `npm run dev`)
- Committed: No

**drizzle:**
- Purpose: Database migrations and metadata
- Generated: Partially (meta files auto-generated, but migrations versioned)
- Committed: Yes (preserves database schema history)

**.planning:**
- Purpose: GSD orchestrator output
- Generated: Yes (by `/gsd:*` commands)
- Committed: Yes (planning documents are version-controlled)

---

*Structure analysis: 2026-02-12*
