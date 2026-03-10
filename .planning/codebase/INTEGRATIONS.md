# External Integrations

**Analysis Date:** 2026-03-10

## APIs & External Services

**Authentication & User Management:**
- Supabase Auth - User registration, login, session management
  - SDK/Client: `@supabase/supabase-js` (2.94.0), `@supabase/ssr` (0.8.0)
  - Auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Implementation: `src/lib/auth/server.ts`, `src/lib/auth/browser.ts`, `middleware.ts`

**Image Hosting & Management:**
- Cloudinary - Image upload, storage, transformation, and deletion
  - SDK/Client: `cloudinary` (2.9.0)
  - Auth: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - Implementation: `src/lib/cloudinary.ts`
  - Upload endpoint: `src/app/api/upload/route.ts` (generates signed upload tokens)
  - Delete integration: Image deletion on layout update (`src/app/api/layouts/[slug]/route.ts`)

**Cloud Storage:**
- AWS S3 - Object storage (integrated but configuration not fully visible)
  - SDK/Client: `@aws-sdk/client-s3` (3.982.0), `@aws-sdk/s3-request-presigner` (3.982.0)
  - Auth: Likely via IAM credentials or environment variables
  - Use case: Potential backup or additional file storage

## Data Storage

**Databases:**
- PostgreSQL
  - Connection: `DATABASE_URL` environment variable
  - Client: `postgres` (3.4.8)
  - ORM: Drizzle ORM (0.45.1)
  - Schema: `src/lib/db/schema.ts`
  - Migrations: Managed by Drizzle Kit, output to `drizzle/` directory

**File Storage:**
- Cloudinary - Primary image storage service
- AWS S3 - Secondary cloud storage (SDK present, usage TBD)
- Local filesystem - Development fallback for CDN images

**Caching:**
- Not detected in current configuration
- React 19 compiler memoization available

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (PostgreSQL-backed, open-source alternative to Firebase)
  - Implementation: Multi-layer approach
    - Server-side: `src/lib/auth/server.ts` - `createSupabaseServerClient()`
    - Client-side: `src/lib/auth/browser.ts` - `createBrowserClient()`
    - Middleware: `middleware.ts` - Session validation for `/editor` routes
  - Session management: Cookie-based with `@supabase/ssr`
  - Protected routes: `/editor/*` requires authenticated user

## Monitoring & Observability

**Error Tracking:**
- Not detected

**Logs:**
- Console logging (standard `console.log`, `console.error`, `console.warn`)
- Examples: Image deletion logging in `src/lib/cloudinary.ts`, error handling in API routes

## CI/CD & Deployment

**Hosting:**
- Not configured in current files; likely Vercel (Next.js native) or self-hosted Node.js

**CI Pipeline:**
- Not detected

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string (critical for database functionality)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (critical for authentication)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (critical for authentication)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name (required for image uploads)
- `CLOUDINARY_API_KEY` - Cloudinary API key (required for image uploads)
- `CLOUDINARY_API_SECRET` - Cloudinary API secret (required for server-side operations)
- `NEXT_PUBLIC_CDN_URL` - CDN URL for image optimization (optional, custom CDN only)

**Secrets location:**
- `.env.local` - Local development (git-ignored)
- Platform-specific (Vercel, etc.) - Production environment variables

## Webhooks & Callbacks

**Incoming:**
- `/api/upload` - POST endpoint that generates Cloudinary upload signatures
  - Purpose: Client-side Cloudinary widget initialization
  - Parameters: `folder` (optional, defaults to "default")
  - Response: `{ timestamp, signature, apiKey, cloudName, folder }`

- `/api/layouts/[slug]` - GET/PUT endpoints for layout CRUD
  - GET: Fetch layout by slug (with fallback to sample layout)
  - PUT: Update layout with image cleanup (deletes removed images from Cloudinary)

**Outgoing:**
- Cloudinary API calls:
  - `cloudinary.uploader.destroy()` - Delete images when removed from layouts
  - Image transformation requests via custom loader (`src/lib/storage/image-loader.ts`)

- Supabase Auth calls:
  - `supabase.auth.getUser()` - Session validation in middleware
  - Session refresh handled by `@supabase/ssr`

## Data Flow

**Image Upload:**
1. Client requests upload signature from `/api/upload` with folder name
2. Server generates signed Cloudinary upload token
3. Client uploads to Cloudinary widget directly (client-side)
4. Cloudinary returns public_id and image metadata
5. Client stores reference in layout state (Zustand)

**Layout Save:**
1. Client calls `/api/layouts/[slug]` PUT with updated layout
2. Server compares old and new layouts to identify deleted images
3. Server deletes removed images from Cloudinary
4. Server saves/updates layout in PostgreSQL via Drizzle
5. Client receives updated layout

**Authentication Flow:**
1. Middleware intercepts requests to `/editor/*`
2. Server-side Supabase client validates session from cookies
3. If no user: redirect to `/login`
4. If authenticated: proceed to next handler

---

*Integration audit: 2026-03-10*
