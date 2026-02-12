# External Integrations

**Analysis Date:** 2026-02-12

## APIs & External Services

**Image Management:**
- Cloudinary - Cloud-based image storage, manipulation, and CDN
  - SDK/Client: `cloudinary` v2.9.0
  - Auth: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - Usage: Image upload, deletion, and URL generation for portfolio editor
  - Implementation: `src/lib/cloudinary.ts`
  - API Endpoints: `POST /api/upload` - generates upload signatures

**File Storage:**
- AWS S3 - Object storage (optional/secondary)
  - SDK/Client: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
  - Auth: Via AWS credentials (not configured in example)
  - Usage: Alternative or complementary file storage backend

## Data Storage

**Databases:**
- PostgreSQL (remote)
  - Connection: `DATABASE_URL` environment variable
  - Client: `postgres` v3.4.8 (direct SQL client)
  - ORM: Drizzle ORM v0.45.1
  - Schema location: `src/lib/db/schema.ts`
  - Tables:
    - `layouts` - Portfolio layouts with JSON data storage
      - Columns: `id` (pk), `slug` (unique), `title`, `data` (JSONB), `updated_at`
  - Migrations: Managed via Drizzle Kit (`drizzle/`)

**File Storage:**
- Cloudinary CDN - Primary image storage and delivery
- AWS S3 (optional) - Alternative object storage
- Custom image loader: `src/lib/storage/image-loader.ts` - Handles image URL normalization and optimization parameters

**Caching:**
- Next.js built-in caching (via response headers)
- No external caching service configured

## Authentication & Identity

**Auth Provider:**
- Supabase - BaaS platform with authentication
  - Implementation: Server-side (SSR) and client-side (browser) with `@supabase/ssr`
  - Client setup: `src/lib/auth/server.ts` and `src/lib/auth/browser.ts`
  - Session management: Cookie-based via Supabase SSR helpers
  - Middleware: `middleware.ts` - Protects `/editor/*` routes with authentication check
  - Configuration:
    - `NEXT_PUBLIC_SUPABASE_URL` - Project URL (public)
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key (safe for client)
  - Login flow: Redirects unauthenticated users from `/editor/*` to `/login`
  - Server client: Uses async `createSupabaseServerClient()` with cookie storage
  - Browser client: Uses `createBrowserClient()` for client-side operations

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Standard console logging via `console.error()` and `console.log()`
- Error logging in:
  - `src/app/api/upload/route.ts` - Upload signature generation errors
  - `src/app/api/layouts/[slug]/route.ts` - Layout save and Cloudinary deletion errors
  - `src/lib/cloudinary.ts` - Image deletion errors

## CI/CD & Deployment

**Hosting:**
- Vercel (Next.js optimized platform, implied by Next.js configuration)

**CI Pipeline:**
- Not configured

## Environment Configuration

**Required env vars:**

**Client-Safe (NEXT_PUBLIC prefix):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public API key
- `NEXT_PUBLIC_CDN_URL` - CDN base URL for image optimization

**Server-Only:**
- `DATABASE_URL` - PostgreSQL connection string
- `CLOUDINARY_CLOUD_NAME` - Cloudinary account name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary secret (private, server-side only)

**Reference:**
- `.env.example` - Template with required Cloudinary and Database vars

**Secrets location:**
- `.env.local` - Local development (not committed)
- Environment variables on hosting platform (Vercel dashboard or similar)

## API Endpoints

**Portfolio Layout APIs:**
- `GET /api/layouts/[slug]` - Retrieve layout by slug
  - Authentication: Not required
  - Returns: Layout JSON with items, styling, and metadata
  - Implementation: `src/app/api/layouts/[slug]/route.ts`

- `PUT /api/layouts/[slug]` - Update or create layout
  - Authentication: Not required (relies on middleware in `/editor/*`)
  - Body: Layout object with items, styling, and metadata
  - Handles: Cloudinary image deletion for removed items
  - Implementation: `src/app/api/layouts/[slug]/route.ts`

**Image Upload Signature:**
- `POST /api/upload` - Generate Cloudinary upload signature
  - Authentication: Not required (signature-based security)
  - Body: `{ folder?: string }` - Cloudinary folder name
  - Returns: Timestamp, signature, API key, cloud name for client-side upload
  - Implementation: `src/app/api/upload/route.ts`

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- Cloudinary image deletion calls from layout update operations
  - Triggered when portfolio items are removed during edit
  - Non-blocking (errors logged but don't halt save operation)

---

*Integration audit: 2026-02-12*
