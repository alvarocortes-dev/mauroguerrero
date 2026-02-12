# Architecture Research

**Domain:** Photography portfolio with admin CMS
**Researched:** 2026-02-12
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                         Next.js 16 App Router                          │
├────────────────────────────────────────────────────────────────────────┤
│  Route Groups & Parallel Routes                                        │
│  ┌──────────────────────────────────────┬──────────────────────────┐   │
│  │  (site) - Public Gallery View        │  (editor) - Auth Routes  │   │
│  │  ├─ page.tsx (Home w/ masonry)       │  ├─ login/page.tsx       │   │
│  │  ├─ projects/[slug]/page.tsx         │  ├─ editor/page.tsx      │   │
│  │  │  (12-col row layout)              │  └─ layout.tsx           │   │
│  │  └─ layout.tsx (site nav)            │                          │   │
│  └──────────────────────────────────────┴──────────────────────────┘   │
│                                                                          │
│  Admin Overlay Pattern (Proposed)                                       │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  /admin - Parallel Routes with @edit slot                     │    │
│  │  ├─ page.tsx (routes to (site) content)                       │    │
│  │  ├─ projects/[slug]/page.tsx (routes to (site) content)       │    │
│  │  └─ @edit/(.)*/page.tsx (intercepted edit overlays)           │    │
│  └────────────────────────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────────────────────────┤
│                         Client State Layer (Zustand)                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │  EditorStore     │  │  ViewerStore     │  │  AdminStore      │     │
│  │ (item selection) │  │ (photo modal)    │  │ (overlay state)  │     │
│  │ (layout edits)   │  │ (index, gallery) │  │ (edit mode)      │     │
│  │ (save state)     │  │                  │  │ (dirty state)    │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│       ↓                       ↓                       ↓                 │
├───────┴───────────────────────┴───────────────────────┴─────────────────┤
│                    React Components                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Renderer │  │ PhotoView│  │EditOverla│  │RowLayout│               │
│  │(masonry) │  │ (modal)  │  │  (edit)  │  │ (12col) │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
├────────────────────────────────────────────────────────────────────────┤
│                    Data & Services Layer                                │
│  ┌────────────────────┐  ┌────────────────────┐                        │
│  │ Database Layer     │  │ External Services  │                        │
│  │ (Drizzle ORM)      │  │ (Cloudinary,       │                        │
│  │ ├─ layouts table   │  │  Supabase Auth)    │                        │
│  │ ├─ projects table  │  │                    │                        │
│  │ └─ images table    │  │                    │                        │
│  └────────────────────┘  └────────────────────┘                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Renderer** | Renders layout items (images, text, spacers) in selected layout mode | Client component, Framer Motion animations |
| **MasonryGrid** | HOME specific - arranges items in masonry columns | CSS Grid or column-based flex layout |
| **RowLayout** | PROJECT specific - arranges items in 12-column row grid | CSS Grid with 12 columns, intelligent row breaks |
| **PhotoViewer** | Modal lightbox for viewing/navigating photos across any gallery | Client component, Zustand state, keyboard nav |
| **EditOverlay** | Admin UI controls appearing over gallery content in /admin routes | Client component, overlaid buttons/panels |
| **EditorCanvas** | Full editing UI for structure/reordering items | Client component with drag-drop (dnd-kit) |

## Recommended Project Structure

```
src/
├── app/
│   ├── (site)/                     # Public user views
│   │   ├── layout.tsx              # Site nav, shared styling
│   │   ├── page.tsx                # Home with masonry grid
│   │   ├── projects/
│   │   │   ├── layout.tsx          # Projects shared layout
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Single project with row layout
│   │   └── api/
│   │       └── projects/
│   │           └── [slug]/
│   │               └── route.ts    # GET projects by slug
│   │
│   ├── (editor)/                   # Protected auth routes
│   │   ├── layout.tsx              # Auth check, editor layout
│   │   ├── login/page.tsx          # Login page
│   │   └── editor/
│   │       ├── page.tsx            # Editor page (edit home)
│   │       └── project/
│   │           └── [slug]/
│   │               └── page.tsx    # Project editor
│   │
│   ├── admin/                      # Admin overlay routes
│   │   ├── layout.tsx              # Admin layout, holds @edit slot
│   │   ├── page.tsx                # Mirrors (site)/page
│   │   ├── projects/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Mirrors (site)/projects/[slug]
│   │   ├── @edit/
│   │   │   ├── default.tsx         # Returns null when no edit active
│   │   │   └── (.)*/               # Intercept routes for edit modals
│   │   │       └── page.tsx
│   │   └── api/ (shared with above)
│   │
│   ├── api/                        # Shared API routes
│   │   ├── layouts/
│   │   │   ├── route.ts            # GET all layouts
│   │   │   └── [slug]/
│   │   │       └── route.ts        # GET/PUT specific layout
│   │   ├── projects/
│   │   │   ├── route.ts            # GET all projects
│   │   │   └── [slug]/
│   │   │       └── route.ts        # GET/PUT/DELETE project
│   │   ├── images/
│   │   │   └── upload/
│   │   │       └── route.ts        # POST image to Cloudinary
│   │   └── auth/
│   │       └── [provider]/
│   │           ├── route.ts        # Supabase auth callback
│   │
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Global styles
│
├── core/
│   ├── renderer/
│   │   ├── Renderer.tsx            # Layout item renderer
│   │   ├── MasonryGrid.tsx         # Home-specific masonry renderer
│   │   ├── RowLayout.tsx           # Project-specific 12-col renderer
│   │   ├── types.ts                # Layout/Item Zod schemas
│   │   └── sample-layout.ts        # Demo data
│   │
│   ├── viewer/
│   │   ├── PhotoViewer.tsx         # Modal lightbox component
│   │   ├── ViewerOverlay.tsx       # Photo nav controls overlay
│   │   ├── store.ts                # Viewer state (Zustand)
│   │   └── usePhotoViewer.ts       # Custom hook
│   │
│   ├── admin/
│   │   ├── EditOverlay.tsx         # Admin edit controls
│   │   ├── AdminToolbar.tsx        # Edit/save/discard buttons
│   │   ├── store.ts                # Admin state (Zustand)
│   │   └── useAdminMode.ts         # Custom hook
│   │
│   └── editor/
│       ├── EditorCanvas.tsx        # Main editor workspace
│       ├── Toolbar.tsx             # Item add/remove buttons
│       ├── PropertiesPanel.tsx     # Item property editor
│       ├── SortableItem.tsx        # Drag-drop item wrapper
│       ├── store.ts                # Editor state (Zustand)
│       └── useEditorStore.ts       # Custom hook
│
├── lib/
│   ├── db/
│   │   ├── client.ts               # Drizzle client
│   │   ├── schema.ts               # Table definitions
│   │   ├── layouts.ts              # Layout queries
│   │   └── projects.ts             # Project queries (NEW)
│   │
│   ├── auth/
│   │   ├── server.ts               # Server-side auth
│   │   └── browser.ts              # Client-side auth
│   │
│   ├── storage/
│   │   └── image-loader.ts         # Cloudinary utilities
│   │
│   └── utils/
│       ├── layout-engine.ts        # Masonry positioning
│       ├── row-layout-engine.ts    # Row-based positioning (NEW)
│       └── types.ts                # Shared types
│
└── components/
    ├── Modal.tsx                   # Generic modal wrapper
    ├── ThemeToggle.tsx             # Dark mode switch
    ├── Navigation.tsx              # Site/admin nav
    └── (other shared components)
```

### Structure Rationale

- **(site) route group:** Keeps public-facing routes organized and separate from admin infrastructure. All views render via Renderer components.
- **(editor) route group:** Protected routes with Supabase auth middleware. Full-featured editing UI with Zustand store.
- **admin/ root route:** Leverage parallel routes with @edit slot to render public view + edit overlay without changing URL. Intercepting routes capture /admin/.../* for overlay modals.
- **/core/** organization: Separates rendering logic (core/renderer) from interactive overlays (core/admin, core/viewer) and editing tools (core/editor).
- **/lib/db/**: Database operations isolated; layouts.ts handles home-specific queries, projects.ts added for project-specific queries.
- **Store files colocated:** Each major feature owns its Zustand store (editor/store.ts, admin/store.ts, viewer/store.ts) for clear ownership and easier testing.

## Architectural Patterns

### Pattern 1: Route Group Organization

**What:** Use Next.js route groups `(name)` to organize routes logically without affecting URL structure. Create separate route groups for different user contexts (site, editor).

**When to use:**
- Different layouts needed for different sections
- Auth/middleware applies differently per section
- Clear separation of concerns (public vs. admin)

**Trade-offs:**
- Pros: Keeps routes organized, supports multiple root layouts, URL structure remains clean
- Cons: Full page reload when navigating between different root layouts (only if using multiple root layouts)

**Example:**
```typescript
// src/app/(site)/layout.tsx
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteProvider>
      <Navigation mode="site" />
      {children}
    </SiteProvider>
  );
}

// src/app/(editor)/layout.tsx - Different layout, different auth
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  // Auth check happens here
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <EditorProvider>
      <EditorNavigation />
      {children}
    </EditorProvider>
  );
}
```

### Pattern 2: Admin Overlay via Parallel Routes

**What:** Use Next.js parallel routes with intercepting routes to render admin edit controls over public gallery views without changing the visible URL. `/admin/projects/[slug]` shows the same content as `/projects/[slug]` but with an overlay via `@edit` slot.

**When to use:**
- Need edit mode without dedicated edit URLs
- Want to preserve context and history
- Need deep-linking with edit controls active

**Trade-offs:**
- Pros: Seamless UX, URL-shareable edit state, clear mental model, leverages Next.js routing
- Cons: Requires understanding of parallel routes and intercepting routes, slightly more file structure

**Example:**
```typescript
// src/app/admin/layout.tsx - Renders public view + edit overlay
export default function AdminLayout({
  children,
  edit,
}: {
  children: React.ReactNode;
  edit: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <div className="relative">
        {children}           {/* Public (site) content */}
        {edit}              {/* Edit overlay via @edit slot */}
      </div>
    </AdminProvider>
  );
}

// src/app/admin/@edit/default.tsx - Return null when no edit is active
export default function Default() {
  return null;
}

// src/app/admin/@edit/(.)projects/[slug]/edit/page.tsx - Intercept and show overlay
export default function EditProjectOverlay({ params }: { params: { slug: string } }) {
  return (
    <Modal>
      <EditOverlay slug={params.slug} />
    </Modal>
  );
}
```

### Pattern 3: Layout-Specific Renderers

**What:** Create different renderer components for different gallery layouts (MasonryGrid for home, RowLayout for projects). Each accepts the same Layout type but arranges items differently.

**When to use:**
- Different layout rules per page (masonry vs. rows)
- Shared item types but different display logic
- Want to swap layouts without changing the data model

**Trade-offs:**
- Pros: Clean separation, reusable item types, easy to add new layouts
- Cons: Slight code duplication between renderers

**Example:**
```typescript
// src/core/renderer/MasonryGrid.tsx
export const MasonryGrid = ({ layout, onImageClick }: Props) => {
  const positions = buildMasonryPositions(layout.items, columnCount);

  return (
    <div className="columns-3 gap-4">
      {layout.items.map((item) => (
        <div key={item.id} className="break-inside-avoid">
          <renderItem(item, { onImageClick }) />
        </div>
      ))}
    </div>
  );
};

// src/core/renderer/RowLayout.tsx
export const RowLayout = ({ layout, onImageClick }: Props) => {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Intelligent row-breaking logic here */}
      {layout.items.map((item) => (
        <div key={item.id} className="col-span-X">
          <renderItem(item, { onImageClick }) />
        </div>
      ))}
    </div>
  );
};
```

### Pattern 4: Shared Photo Viewer via Zustand

**What:** Global photo viewer modal state (Zustand store) that any gallery can open. PhotoViewer component consumes this state and displays a lightbox modal for any photo in any gallery.

**When to use:**
- Photo viewer accessed from multiple contexts (home gallery, project galleries, admin mode)
- Need consistent photo navigation/keyboard shortcuts across app
- Want to avoid prop-drilling open/close/index state

**Trade-offs:**
- Pros: Single source of truth, easy to access from any component, consistent UX
- Cons: Global state can be harder to debug, requires cleanup on unmount

**Example:**
```typescript
// src/core/viewer/store.ts
export const useViewerStore = create<ViewerState>((set) => ({
  isOpen: false,
  images: [],
  currentIndex: 0,
  galleryId: null, // Track which gallery opened the viewer

  openViewer: (images, index, galleryId) => set({ isOpen: true, images, currentIndex: index, galleryId }),
  closeViewer: () => set({ isOpen: false }),
  nextPhoto: () => set((state) => ({
    currentIndex: (state.currentIndex + 1) % state.images.length,
  })),
  prevPhoto: () => set((state) => ({
    currentIndex: state.currentIndex === 0 ? state.images.length - 1 : state.currentIndex - 1,
  })),
}));

// Usage in gallery
const MasonryGrid = ({ layout, onImageClick }: Props) => {
  const { openViewer } = useViewerStore();
  const images = layout.items.filter((item) => item.type === 'image');

  return (
    <div className="masonry">
      {images.map((img, idx) => (
        <button
          key={img.id}
          onClick={() => openViewer(images, idx, 'home')}
        >
          <Image src={img.src} alt={img.alt} />
        </button>
      ))}
    </div>
  );
};

// Root layout includes viewer
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PhotoViewer /> {/* Rendered once, available everywhere */}
    </>
  );
}
```

### Pattern 5: Zustand Store Slicing

**What:** Organize each major feature's state in its own Zustand store. Editor state, admin state, viewer state are separate stores, combined via hooks.

**When to use:**
- Multiple independent state domains
- Each domain has its own actions and selectors
- Reduces coupling between features

**Trade-offs:**
- Pros: Clear boundaries, easy to test, can add/remove features independently
- Cons: Slightly more boilerplate, need to manage multiple store subscriptions

**Example:**
```typescript
// src/core/editor/store.ts
export const useEditorStore = create<EditorState>((set, get) => ({
  layout: null,
  selectedId: null,
  isSaving: false,
  hasUnsavedChanges: false,
  setLayout: (layout) => set({ layout }),
  updateItem: (id, updates) => { /* ... */ },
  saveLayout: async () => { /* ... */ },
}));

// src/core/admin/store.ts (NEW)
export const useAdminStore = create<AdminState>((set) => ({
  isEditMode: false,
  editingPath: null, // Which page is being edited
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  setEditingPath: (path) => set({ editingPath: path }),
}));

// Component can use both
export const AdminLayout = ({ children, edit }: Props) => {
  const { isEditMode } = useAdminStore();
  const { hasUnsavedChanges, saveLayout } = useEditorStore();

  return (
    <div>
      {children}
      {isEditMode && edit}
    </div>
  );
};
```

## Data Flow

### Request Flow: User Views Project

```
User clicks /projects/my-trip
    ↓
Next.js Routes → (site)/projects/[slug]/page.tsx (Server Component)
    ↓
getProjectBySlug(slug) → Database Query
    ↓
Renderer/RowLayout receives project layout
    ↓
Client-side MasonryGrid renders items with motion animations
    ↓
User sees gallery; clicks photo
    ↓
Image click → useViewerStore.openViewer(images, index)
    ↓
PhotoViewer modal opens in root layout (already mounted)
    ↓
User navigates photos via arrow keys/buttons (Zustand state updates)
```

### Admin Edit Flow: User Clicks Edit Button in /admin

```
User at /admin/projects/my-trip (parallel route)
    ↓
@edit slot renders null (default.tsx) - no overlay visible
    ↓
User clicks "Edit Project" button
    ↓
Navigate to /admin/projects/my-trip/edit
    ↓
Next.js intercepts via @edit/(.)projects/[slug]/edit/page.tsx
    ↓
Edit modal renders over public view (via @edit slot)
    ↓
EditOverlay component mounts, loads project via API
    ↓
useAdminStore.setEditingPath(path) - sets active edit context
    ↓
Changes saved via API
    ↓
useEditorStore.saveLayout() triggers save
    ↓
Admin closes modal (router.back())
    ↓
@edit slot returns null again, overlay disappears
```

### State Management Data Flow

```
                    Zustand Stores (Global)
                    ┌─────────────────────────┐
                    │  EditorStore            │
                    │  - layout, selectedId   │
                    │  - hasUnsavedChanges    │
                    └──────────┬──────────────┘
                               │ (subscribe)
                    ┌──────────┴──────────────┐
                    │                         │
            ┌───────▼────────┐     ┌────────▼──────┐
            │ EditorCanvas   │     │ PropertiesPanel│
            │ (reads state)  │     │ (reads state)  │
            └───────┬────────┘     └────────┬──────┘
                    │                      │
                    └──────────┬───────────┘
                             (writes)
                    ┌──────────▼──────────────┐
                    │  useEditorStore()      │
                    │  updateItem()          │
                    │  addItem()             │
                    │  removeItem()          │
                    │  saveLayout()          │
                    └────────────────────────┘
```

## Scaling Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Database queries** | One query per page load OK | Add caching layer for layouts query | Implement database read replicas |
| **Image delivery** | Cloudinary direct URLs fine | CDN caching via Cloudinary intelligent transformation | Image optimization server, resize on-demand |
| **Admin overhead** | Single store, no issues | Separate stores per module (already doing this) | Consider request batching API |
| **Bundle size** | ~60KB gzipped OK | Monitor Zustand store size | Implement code splitting for admin features |
| **Concurrent editors** | Not an issue | Implement optimistic updates, conflict resolution | WebSocket for real-time collab |

## Anti-Patterns

### Anti-Pattern 1: Prop Drilling Photo Viewer State

**What people do:** Pass `isViewerOpen`, `currentPhotoIndex`, `photos` as props down 5+ component levels instead of using Zustand.

**Why it's wrong:** Makes refactoring hard, components become tightly coupled, hard to reuse components in different contexts where photo viewer might be needed.

**Do this instead:** Use `useViewerStore()` hook from any component that needs to open/navigate the photo viewer. Keep prop drilling for "presentation" data only (colors, labels), not app state.

```typescript
// ❌ Don't do this
export const MasonryGrid = ({
  layout,
  isViewerOpen,
  currentPhotoIndex,
  photos,
  onPhotoClick
}: Props) => {
  return (
    // Pass props down further...
  );
};

// ✅ Do this
export const MasonryGrid = ({ layout }: Props) => {
  const { openViewer } = useViewerStore();

  return (
    <div onClick={() => openViewer(images, index)}>
      {/* ... */}
    </div>
  );
};
```

### Anti-Pattern 2: Overusing Zustand for Local Component State

**What people do:** Put every toggle (`showDetails`, `isExpanded`) in a global store instead of local `useState`.

**Why it's wrong:** Pollutes global state, makes debugging harder, unnecessary complexity for UI-only state that doesn't need to persist or be shared across routes.

**Do this instead:** Use `useState` for local UI state (button active, accordion open). Use Zustand only for state that crosses component/route boundaries (which gallery opened viewer, which item is selected in editor).

```typescript
// ❌ Don't do this - use Zustand for button toggle
const useUIStore = create((set) => ({
  showFilters: false,
  toggleFilters: () => set((state) => ({ showFilters: !state.showFilters })),
}));

// ✅ Do this - use useState for local UI state
export const Gallery = () => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <button onClick={() => setShowFilters(!showFilters)}>
      Toggle Filters
    </button>
  );
};
```

### Anti-Pattern 3: Admin Overlay as Separate Route

**What people do:** Create `/edit/projects/[slug]` as a standalone route instead of using parallel routes.

**Why it's wrong:** Loses context (user scrolled to middle of gallery, you navigate away and back, scroll position lost). URL changes, can't deep-link the edit state. Requires loading the entire page again.

**Do this instead:** Use parallel routes so `/admin/projects/[slug]` and `/admin/projects/[slug]/edit` render the same content with overlay. URL shows edit state, context preserved, refreshes work correctly.

```typescript
// ❌ Don't do this - separate route loses context
// /edit/projects/[slug]/page.tsx - full page reload

// ✅ Do this - parallel routes keep context
// /admin/layout.tsx receives @edit slot
// /admin/@edit/(.)projects/[slug]/edit/page.tsx - intercepts without full reload
```

### Anti-Pattern 4: Layout Data in URL Query Params

**What people do:** Pass entire layout JSON in URL: `/editor?layout={...huge JSON...}` instead of loading from database.

**Why it's wrong:** URL becomes unshare-able, browser history becomes bloated, URL length limits kick in, no persistence.

**Do this instead:** Store layouts in database, load via API/database query, reference by slug in URL.

```typescript
// ❌ Don't do this
// /editor?layout={"items":[...]}

// ✅ Do this
// /editor (or /(editor)/editor/page.tsx)
// useEffect(() => {
//   fetch(`/api/layouts/home`).then(layout => setLayout(layout))
// })
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Cloudinary** | REST API via /api/images/upload | Handles image optimization, transformation URLs via cloudinary.url() |
| **Supabase Auth** | OAuth provider via /api/auth/[provider]/route.ts | Stores session in cookies, validated server-side |
| **PostgreSQL** | Drizzle ORM queries in /lib/db/ | Connection pooling via Postgres client, JSONB for layout data |
| **Vercel** | Next.js deployment, Image Optimization | Automatic ISR for static pages, serverless functions for API |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **(site) ↔ (editor)** | API calls via /api/layouts/[slug] | Editor fetches layout, PUT to save |
| **Viewer ↔ Renderer** | Zustand store + click handlers | Renderer calls useViewerStore.openViewer() |
| **Admin ↔ (site)** | Parallel routes, same API calls | /admin mirrors (site) content, adds @edit overlay |
| **Renderer ↔ Layout Types** | Zod schema validation | Layout, LayoutItem types shared via zod schemas |

## Sources

- [Next.js 16 Route Groups Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [Next.js 16 Parallel Routes Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes)
- [Zustand Official Documentation - Slices Pattern](https://zustand.docs.pmnd.rs/guides/slices-pattern)
- [Zustand Multiple Stores Discussion](https://github.com/pmndrs/zustand/discussions/2496)
- [Working with Zustand - TkDodo's Blog](https://tkdodo.eu/blog/working-with-zustand)
- [React Lightbox Component Libraries - HubPages](https://discover.hubpages.com/technology/React-Image-Modal)
- [Masonry Layout Architecture - Svelte Gallery GitHub](https://github.com/madeleineostoja/svelte-gallery)

---
*Architecture research for: Photography portfolio with admin CMS*
*Researched: 2026-02-12*
