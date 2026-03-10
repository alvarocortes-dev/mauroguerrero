# Architecture Research

**Domain:** Single-user photography portfolio with block-based grid editor, image processing pipeline, and content protection
**Researched:** 2026-03-10
**Confidence:** HIGH (existing codebase analyzed + verified against current library docs and ecosystem)

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         PUBLIC SITE (SSR)                            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────┐  │
│  │  Homepage   │  │   Projects   │  │  Project   │  │  Lightbox  │  │
│  │  Grid View  │  │  Directory   │  │  Grid View │  │  Viewer    │  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  └─────┬──────┘  │
│         └────────────────┴────────────────┴───────────────┘         │
│                                  │                                   │
│                       Content Protection Layer                       │
│          (signed URLs, low-res proxy, overlay, JS guards)            │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
┌──────────────────────────────────▼───────────────────────────────────┐
│                         API LAYER (Route Handlers)                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │  /api/     │  │  /api/     │  │  /api/     │  │  /api/        │  │
│  │  layouts   │  │  upload    │  │  images    │  │  analytics    │  │
│  └────────────┘  └────────────┘  └────────────┘  └───────────────┘  │
└──────────┬────────────────┬───────────────┬──────────────────────────┘
           │                │               │
┌──────────▼──────┐  ┌──────▼──────┐  ┌────▼─────────────────────────┐
│  AUTH LAYER     │  │  IMAGE      │  │  DATA LAYER                  │
│  (Auth.js v5 +  │  │  PIPELINE   │  │  ┌──────────┐  ┌──────────┐  │
│   TOTP/2FA +    │  │  (Sharp:    │  │  │ Drizzle  │  │Cloudflare│  │
│   middleware)   │  │  resize,    │  │  │   ORM    │  │    R2    │  │
└─────────────────┘  │  watermark, │  │  │(Postgres)│  │ Storage  │  │
                     │  EXIF,      │  │  └──────────┘  └──────────┘  │
                     │  variants)  │  └─────────────────────────────-─┘
                     └─────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│                     EDITOR (Client-Side, /editor/*)                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────┐  │
│  │  Block Grid │  │  Zustand     │  │  Photo     │  │  Project   │  │
│  │  Canvas     │  │  Editor Store│  │  Library   │  │  Manager   │  │
│  └─────────────┘  └──────────────┘  └────────────┘  └────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Block Grid Canvas | Render drag/drop/resize grid with column-span blocks | Zustand EditorStore, dnd-kit |
| Grid Renderer | Display grid layouts (both editor and public) | Layout data, Next.js Image |
| Zustand EditorStore | Single source of truth for editor state (layouts, projects, selected block) | Block Canvas, API layer |
| Image Pipeline (Sharp) | Server-side: resize variants, composite watermark, extract EXIF, write to R2 | R2 Storage, DB (EXIF table) |
| Photo Library | Browse/search uploaded photos, assign to blocks | EditorStore, Image Pipeline |
| Project Manager | CRUD for projects, each with its own grid layout | EditorStore, DB layouts table |
| Content Protection Layer | Serve signed/expiring URLs, proxy low-res images, inject JS guards | R2, API image route |
| Auth Layer (Auth.js + TOTP) | Credential check, TOTP verification, session management, middleware guard | Middleware, DB users table |
| Analytics | Record page views, referrers, geography | DB analytics table, Cloudflare headers |

---

## Recommended Project Structure (Evolution from Current)

```
src/
├── app/
│   ├── (site)/                    # Public SSR pages (existing, extended)
│   │   ├── page.tsx               # Homepage grid
│   │   ├── projects/
│   │   │   └── [slug]/page.tsx    # Project grid page (new)
│   │   └── layout.tsx
│   ├── (editor)/                  # Protected editor pages (existing, extended)
│   │   ├── editor/
│   │   │   ├── page.tsx           # Home layout editor
│   │   │   └── projects/
│   │   │       ├── page.tsx       # Project list
│   │   │       └── [slug]/page.tsx # Per-project grid editor (new)
│   │   ├── library/page.tsx       # Photo library (new)
│   │   └── layout.tsx
│   ├── api/
│   │   ├── layouts/[slug]/route.ts  # Existing, extend for projects
│   │   ├── upload/route.ts          # Replace: Sharp pipeline + R2 (replaces Cloudinary)
│   │   ├── images/
│   │   │   ├── [id]/route.ts        # Signed URL proxy / low-res serve (new)
│   │   │   └── signed/route.ts      # Generate time-limited R2 presigned URL (new)
│   │   ├── projects/route.ts        # Project CRUD (new)
│   │   └── analytics/route.ts       # Record visits (new)
│   └── login/page.tsx               # 2FA-aware login page
├── core/
│   ├── editor/
│   │   ├── store.ts               # Extended: projects, photo library state
│   │   ├── BlockCanvas.tsx        # Replaces EditorCanvas — CSS Grid with col/row spans
│   │   ├── BlockItem.tsx          # Replaces SortableItem — span-aware, resizable
│   │   ├── PropertiesPanel.tsx    # Extended: block size, EXIF display
│   │   └── Toolbar.tsx            # Extended: column count control
│   ├── renderer/
│   │   ├── GridRenderer.tsx       # Replaces Renderer — CSS Grid with column config
│   │   ├── BlockRenderer.tsx      # Renders individual blocks (image, text, spacer, video)
│   │   ├── types.ts               # Extended: GridBlock with colSpan/rowSpan, GridLayout with columns
│   │   └── Lightbox.tsx           # New: fullscreen viewer with keyboard nav
│   └── layout-engine/             # Replaced by CSS Grid (column config in data, not JS)
├── lib/
│   ├── auth/                      # Replace Supabase with Auth.js v5
│   │   ├── config.ts              # Auth.js config: credentials + TOTP provider
│   │   ├── totp.ts                # TOTP generation/verification (otplib)
│   │   └── session.ts             # Session helpers
│   ├── storage/
│   │   ├── r2.ts                  # AWS SDK S3 client configured for R2 (replaces cloudinary.ts)
│   │   ├── presign.ts             # Generate presigned GET URLs (time-limited, content protection)
│   │   └── image-loader.ts        # Updated loader pointing to signed URL proxy
│   ├── pipeline/                  # New: server-side image processing
│   │   ├── process.ts             # Sharp pipeline: resize variants, watermark, EXIF
│   │   ├── variants.ts            # Size definitions: thumb(400px), medium(1200px), full(2400px)
│   │   └── exif.ts                # EXIF extraction with exifr, normalize to schema
│   ├── protection/                # New: content protection utilities
│   │   ├── signed-url.ts          # Generate expiring proxy URLs
│   │   └── guards.ts              # JS anti-drag, right-click, devtools detection snippets
│   ├── analytics/
│   │   └── track.ts               # Server-side visit recording
│   └── db/
│       ├── client.ts              # Existing
│       ├── schema.ts              # Extended (see Data Model section)
│       ├── layouts.ts             # Extended: includes projects
│       ├── images.ts              # New: photo library CRUD
│       └── analytics.ts           # New: visit queries
└── middleware.ts                  # Updated: Auth.js session check (replaces Supabase check)
```

---

## Architectural Patterns

### Pattern 1: Server-Side Image Processing Pipeline (Upload → Process → Store)

**What:** On upload, the API route receives the raw file buffer, passes it through a Sharp pipeline synchronously, and stores all three size variants in R2 before returning. EXIF is extracted in the same request and written to the database.

**When to use:** Single-user admin context. Upload frequency is very low (one photographer). Synchronous processing on Vercel is fine up to ~4.5MB JPEG within the 60-second function timeout. No job queue needed.

**Trade-offs:** Simple (no queue), but if raw files are large (>15MB) or uploads happen in bursts, the function could timeout. Mitigate by capping upload size at 12MB raw and processing synchronously.

**Build order implication:** Image pipeline must be complete before the photo library UI and before blocks can reference images. This is a foundational dependency.

```typescript
// src/app/api/upload/route.ts (conceptual)
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File;
  const buffer = Buffer.from(await file.arrayBuffer());

  // 1. Extract EXIF before Sharp strips it
  const exif = await extractEXIF(buffer);

  // 2. Process variants
  const [thumb, medium, full] = await Promise.all([
    processVariant(buffer, "thumb"),   // 400px wide, watermark applied
    processVariant(buffer, "medium"),  // 1200px wide, watermark applied
    processVariant(buffer, "full"),    // 2400px wide, watermark applied
  ]);

  // 3. Upload all variants to R2
  const id = nanoid();
  await Promise.all([
    uploadToR2(`${id}/thumb.webp`, thumb),
    uploadToR2(`${id}/medium.webp`, medium),
    uploadToR2(`${id}/full.webp`, full),
  ]);

  // 4. Persist metadata + EXIF to DB
  await saveImage({ id, exif, variants: ["thumb", "medium", "full"] });
  return NextResponse.json({ id });
}
```

### Pattern 2: Block-Based CSS Grid (Column + Row Span Data Model)

**What:** Each block carries `colSpan` and `rowSpan` values. The grid container is defined with a `columns` count stored on the layout. Rendering uses `grid-column: span N` and `grid-row: span N` CSS. This replaces the current masonry/layout-engine approach.

**When to use:** This is the core editor pattern. CSS Grid is the right primitive — no library abstraction needed. The existing dnd-kit handles drag ordering; resize handles update `colSpan`/`rowSpan` in the Zustand store.

**Trade-offs:** Pure CSS Grid with `grid-auto-flow: row dense` handles auto-placement well. However, precise positioning (place block at column 3, row 2) requires storing explicit `gridColumnStart`/`gridRowStart` — avoid this complexity unless the photographer specifically needs it. Start with auto-flow dense.

```typescript
// Extended types (replaces current types.ts)
export const gridBlockSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "text", "spacer", "video"]),
  colSpan: z.number().int().min(1).max(12).default(1),
  rowSpan: z.number().int().min(1).max(6).default(1),
  imageId: z.string().optional(),   // References images table
  content: z.string().optional(),
  videoUrl: z.string().optional(),
});

export const gridLayoutSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  columns: z.number().int().min(1).max(12).default(3),
  gap: z.number().int().min(0).max(32).default(4),
  blocks: z.array(gridBlockSchema),
  updatedAt: z.string(),
});
```

### Pattern 3: Two-Tier Image Delivery (Low-Res Public / Signed High-Res)

**What:** Public pages always display `medium` variant (1200px) served through a Next.js proxy route that generates a short-lived R2 presigned URL. The R2 bucket is private. The `full` variant is only accessible via a fresh presigned URL generated per-request in the lightbox.

**When to use:** This pattern addresses the photographer's specific content protection requirement. The bucket is never public. Direct R2 URLs are never exposed to clients.

**Trade-offs:** Every image render requires a presigned URL generation call (or caching the URL for its TTL, ~15 minutes). The proxy adds one network hop per image. This is acceptable for a portfolio where page weight matters less than protection.

```
User requests page
  → SSR renders <img src="/api/images/[id]?size=medium" />
  → /api/images/[id] generates presigned R2 URL (15min TTL)
  → Redirects (302) client to presigned R2 URL
  → Client caches the redirect for 15min via Cache-Control
  → R2 serves WebP directly to client

Lightbox opens:
  → Client POSTs to /api/images/signed with { id, size: "full" }
  → Server verifies: is this a public layout? (no auth required for public)
  → Returns fresh presigned URL (5min TTL for full-res)
  → Lightbox loads full-res from presigned URL
```

### Pattern 4: Auth.js v5 with Two-Factor Authentication

**What:** Replace Supabase auth with Auth.js v5 (formerly NextAuth). Use a Credentials provider for password check. Store a TOTP secret in the database. After password verification, if 2FA is enabled, set a temporary `requiresTwoFactor` flag on the session token. Middleware intercepts editor routes and redirects to a 2FA verification page if the flag is set.

**When to use:** Single-admin scenario. Simpler than OAuth flows. TOTP via `otplib` library (well-maintained, RFC 6238 compliant).

**Trade-offs:** Credentials provider requires careful CSRF protection (Auth.js handles this). Session state must track 2FA completion separately from authentication. Two database reads per login (password check + TOTP verification).

```
POST /api/auth/callback/credentials
  → Verify password against bcrypt hash in DB
  → If valid: return user with { requiresTwoFactor: true }
  → Auth.js creates session token with flag set

Middleware checks token:
  → If requiresTwoFactor === true AND path !== /verify-2fa → redirect
  → POST /api/auth/verify-totp
     → Validate TOTP code with otplib
     → Update session: requiresTwoFactor = false, twoFactorVerified = true
```

---

## Data Flow

### Upload and Process Flow

```
Editor: User selects file(s)
    ↓
Client: POST /api/upload (multipart/form-data)
    ↓
Server (Sharp pipeline):
  1. Extract EXIF (exifr) from raw buffer
  2. Auto-orient from EXIF
  3. Resize to thumb / medium / full variants
  4. Composite watermark SVG over each variant
  5. Convert to WebP
    ↓
Server: Parallel upload all variants to R2 (AWS SDK PutObject)
    ↓
Server: INSERT into images table (id, exif JSON, variant paths, upload date)
    ↓
Client receives: { imageId }
    ↓
Editor: User drags image from Photo Library into a grid block
    ↓
Zustand store: block.imageId = imageId
    ↓
User saves layout → PUT /api/layouts/[slug] persists block data
```

### Public Render Flow

```
Visitor hits /projects/[slug]
    ↓
Next.js SSR: getLayoutBySlug(slug) via Drizzle → PostgreSQL
Returns: { columns, blocks: [{ id, type, colSpan, rowSpan, imageId }] }
    ↓
GridRenderer: maps blocks → <div style="grid-column: span N">
  Each image block: <img src="/api/images/[imageId]?size=medium" />
    ↓
Browser requests /api/images/[imageId]?size=medium
    ↓
API route: generatePresignedUrl(r2Key, ttl=900) → signed R2 URL
API route: Response.redirect(signedUrl, 302) with Cache-Control: max-age=900
    ↓
Browser: caches redirect, fetches WebP from R2 directly
    ↓
Content protection: JS overlay injected in layout.tsx disables right-click,
  drag, selection on all img elements (class-based)
```

### Editor State Flow

```
Zustand EditorStore
    ├── layout: GridLayout (home)
    ├── projects: Project[] (list with metadata)
    ├── activeProjectSlug: string | null
    ├── activeLayout: GridLayout (currently editing)
    ├── selectedBlockId: string | null
    ├── photoLibrary: Photo[] (loaded on demand)
    └── hasUnsavedChanges: boolean

User drags block → moveBlock(id, newIndex) → store update → React re-render
User resizes block → updateBlock(id, { colSpan, rowSpan }) → store update
User drops photo → updateBlock(id, { imageId }) → store update
User clicks Save → PUT /api/layouts/[slug] → store.hasUnsavedChanges = false
```

---

## Component Boundaries

| Boundary | Direction | Protocol | Notes |
|----------|-----------|----------|-------|
| BlockCanvas ↔ EditorStore | bidirectional | Zustand subscribe/actions | Canvas reads store, actions write back |
| EditorStore ↔ API layouts | client → server | fetch PUT/GET | Store initiates, API validates with Zod |
| Photo Library ↔ API images | client → server | fetch GET/POST | Paginated photo list, upload trigger |
| API upload ↔ Sharp pipeline | internal | function call (same handler) | No queue, synchronous within request |
| Sharp pipeline ↔ R2 | server → external | AWS SDK S3 PutObject | R2 endpoint in env vars |
| API images ↔ R2 | server → external | AWS SDK S3 GetObject presign | Short-lived URL, never cached on server |
| GridRenderer ↔ API images | client → server | img src proxy | 302 redirect to presigned R2 URL |
| Middleware ↔ Auth.js | server internal | next-auth session cookie | Edge-compatible session read |
| Analytics ↔ DB | server → DB | Drizzle INSERT | Fire-and-forget in API route (non-blocking) |

---

## Data Model Evolution

The existing schema has two tables (`layouts` with JSONB data). The new schema needs to separate concerns:

```
layouts (existing, extended)
  id, slug, title, columns (new), gap (new), data (JSONB blocks), updated_at

projects (new)
  id, slug, title, description, category, order, layout_id (FK → layouts), created_at

images (new — photo library)
  id, filename, r2_key_prefix, width, height, aspect_ratio,
  exif (JSONB: camera, lens, focal_length, aperture, iso, shutter_speed, shot_at),
  uploaded_at

users (new — replaces Supabase)
  id, email, password_hash, totp_secret, two_factor_enabled, created_at

analytics_events (new)
  id, page_path, referrer, country, city, user_agent, visited_at
```

**Key design decision:** `images` table is a library independent of layouts. Blocks reference `imageId` rather than storing URLs directly. This allows reusing the same photo across multiple layouts without duplication in R2.

---

## Build Order (Dependencies Between Components)

This order reflects what must exist before the next thing can be built:

**Step 1 — Foundation (everything depends on this)**
1. Auth.js v5 + TOTP replaces Supabase middleware
2. R2 client + presigned URL utilities replace Cloudinary
3. DB schema migration: extend `layouts`, add `projects`, `images`, `users` tables

**Step 2 — Image Pipeline (blocks can't hold images until this exists)**
4. Sharp processing pipeline (resize variants, watermark, EXIF extraction)
5. Upload API route using pipeline + R2 (replaces existing `/api/upload`)
6. Image proxy route (`/api/images/[id]`) for signed URL delivery

**Step 3 — Grid Editor (depends on new block schema and image pipeline)**
7. Updated Zod types: `GridBlock` with colSpan/rowSpan, `GridLayout` with columns
8. `GridRenderer` component (replaces `Renderer`, CSS Grid with col/row spans)
9. `BlockCanvas` + `BlockItem` (replaces `EditorCanvas`, span-aware drag/resize)
10. Photo Library panel in editor (browse images table, drag into blocks)

**Step 4 — Projects System (depends on grid editor being stable)**
11. Projects DB CRUD + API routes
12. Project list in editor sidebar (expandable directory)
13. Per-project grid editor page
14. Public project pages (`/projects/[slug]`)

**Step 5 — Content Protection (depends on image delivery and public pages)**
15. JS guards in layout (right-click, drag, selection)
16. DevTools detection script
17. Lightbox with full-res signed URL request

**Step 6 — Supporting Features (can be added in any order after Step 5)**
18. EXIF display in lightbox and properties panel
19. Analytics recording and dashboard
20. Site management (bio, contact, credits) from admin

---

## Anti-Patterns

### Anti-Pattern 1: Direct R2 URL Exposure

**What people do:** Make R2 bucket public, store full R2 URLs in the database, reference them directly in `<img src>` tags.

**Why it's wrong:** Public bucket URLs are permanent and unrevocable. Anyone who finds the URL (via DevTools, scraping, or source inspection) has permanent access to the original file. Destroys the entire content protection architecture.

**Do this instead:** Keep R2 bucket private. Always serve images through the proxy route. Generate presigned URLs server-side with short TTLs. Store only the R2 key prefix (e.g., `abc123/`) in the database, never the full URL.

### Anti-Pattern 2: Storing Image Sizes as Cloudinary Transformation URLs

**What people do:** Store the CDN URL with query parameters for each size (`?w=400`, `?w=1200`) and generate size variants at render time via URL manipulation.

**Why it's wrong:** This approach ties the data model to the CDN's URL scheme. When migrating CDNs (as this project is doing from Cloudinary to R2), all stored URLs break. R2 doesn't support on-the-fly transforms.

**Do this instead:** Store only the image ID. Process and store all variants at upload time. The data model references `imageId`, and the proxy route selects the variant via query param (`?size=medium`).

### Anti-Pattern 3: Synchronous Image Upload from Client to Server for Large Files

**What people do:** POST raw file bytes to the Next.js API route, which buffers the entire file in memory, processes it, and forwards to storage — all in one synchronous chain.

**Why it's wrong:** Vercel serverless functions have a 4.5MB body limit by default (configurable to 50MB in config) and a 60-second timeout. Large RAW files or many simultaneous uploads will fail.

**Do this instead:** Use the `bodyParser: false` config and stream the file. Cap upload size at 12MB compressed JPEG (not RAW). For this single-user portfolio, this is sufficient — the photographer uploads processed JPEGs, not RAW files.

### Anti-Pattern 4: Putting Grid Layout Logic in JavaScript

**What people do:** Calculate grid positions, column widths, and item placement in JavaScript/React state, then apply inline styles.

**Why it's wrong:** This duplicates what CSS Grid does natively, adds complexity, and makes the layout engine harder to maintain. The existing `layout-engine/` JS masonry calculator is unnecessary once CSS Grid is used.

**Do this instead:** Store only `colSpan` and `rowSpan` per block, plus `columns` on the layout. Let CSS Grid handle all positioning via `grid-template-columns: repeat(N, 1fr)` and `grid-column: span N`. Delete the layout-engine module.

### Anti-Pattern 5: Using Supabase for Auth When the Project Has No Free Tier Reliability

**What people do:** Keep Supabase auth to avoid migration work, accepting that the project suspends after 1 week of inactivity.

**Why it's wrong:** The photographer works on the portfolio periodically, not daily. A suspended project means the admin is inaccessible — content can't be updated. This is the exact problem that was already identified.

**Do this instead:** Self-hosted Auth.js v5 with credentials provider and TOTP. Sessions live in the PostgreSQL database (already managed, no inactivity suspension). One-time migration effort, permanent reliability gain.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Cloudflare R2 | AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) | R2 is S3-compatible; set endpoint to R2 account URL |
| PostgreSQL (Neon/Turso) | Drizzle ORM (existing) | Extend schema, add tables |
| Cloudflare Analytics | Script tag in `<head>` | No server-side integration needed; Cloudflare dashboard shows traffic |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Editor ↔ Photo Library | Zustand store (shared state) | Library is a panel within editor context |
| Public pages ↔ Image proxy | HTTP (img src) | Standard browser request; proxy adds auth logic |
| Middleware ↔ Auth session | Next.js cookies | Auth.js v5 uses encrypted JWT in cookie; edge-compatible |
| Upload handler ↔ Sharp | In-process function call | No IPC, no queue; keep in same API route handler |

---

## Scaling Considerations

| Concern | Current Scale (1 user, ~100 visitors/day) | Notes |
|---------|------------------------------------------|-------|
| Image processing | Synchronous in upload handler | Fine at this scale; single user uploads infrequently |
| Presigned URL generation | Per-request, ~1ms | PostgreSQL + R2 SDK call; negligible at <1000 visitors/day |
| DB queries | Direct Drizzle queries | No connection pooling needed at this scale |
| Analytics writes | Fire-and-forget INSERT | Non-blocking; Postgres handles this easily |

This project will not reach a scale where these patterns need revisiting. The budget constraint (free tier) is the binding constraint, not performance. Design for simplicity over premature optimization.

---

## Sources

- [Sharp — High performance Node.js image processing](https://sharp.pixelplumbing.com/) — MEDIUM confidence (official docs, API stable)
- [exifr — Fastest JS EXIF reading library](https://github.com/MikeKovarik/exifr) — MEDIUM confidence (GitHub, actively maintained)
- [Cloudflare R2 Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) — HIGH confidence (official Cloudflare docs)
- [Next.js + R2 upload with presigned URLs](https://www.buildwithmatija.com/blog/how-to-upload-files-to-cloudflare-r2-nextjs) — MEDIUM confidence (community tutorial, verified pattern)
- [Auth.js Credentials Provider](https://authjs.dev/getting-started/providers/credentials) — HIGH confidence (official Auth.js docs)
- [Auth.js 2FA with Next.js example](https://github.com/bharathvaj-ganesan/next-auth-2fa-example) — MEDIUM confidence (community, pattern well-established)
- [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout) — MEDIUM confidence (GitHub, considered but not recommended over native CSS Grid for this use case)

---

*Architecture research for: Mauro Guerrero Photography Portfolio (milestone 2 evolution)*
*Researched: 2026-03-10*
