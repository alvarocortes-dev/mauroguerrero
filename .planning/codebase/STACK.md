# Technology Stack

**Analysis Date:** 2026-03-10

## Languages

**Primary:**
- TypeScript 5 - All source code and configuration
- JavaScript (JSX/TSX) - React components and Next.js pages

**Secondary:**
- SQL - PostgreSQL database queries (via Drizzle ORM)
- CSS - Tailwind CSS for styling

## Runtime

**Environment:**
- Node.js (version not specified in .nvmrc; inferred from Next.js 16 requirements: v18+)

**Package Manager:**
- npm - Primary package manager
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with API routes, middleware, SSR
- React 19.2.3 - UI component library
- React DOM 19.2.3 - DOM rendering

**Database & ORM:**
- Drizzle ORM 0.45.1 - Type-safe SQL query builder
- Drizzle Kit 0.31.8 - CLI for database migrations and schema management
- postgres 3.4.8 - PostgreSQL client library

**UI & Styling:**
- Tailwind CSS 4 - Utility-first CSS framework
- @tailwindcss/postcss 4 - PostCSS plugin for Tailwind
- Lucide React 0.563.0 - Icon library
- Framer Motion 12.31.0 - Animation and motion library

**Text Editing:**
- @tiptap/react 3.19.0 - React wrapper for Tiptap editor
- @tiptap/starter-kit 3.19.0 - Complete editor extension collection
- @tiptap/extension-placeholder 3.19.0 - Placeholder text extension

**Drag & Drop:**
- @dnd-kit/core 6.3.1 - Headless drag and drop library
- @dnd-kit/sortable 10.0.0 - Sortable preset for dnd-kit
- @dnd-kit/modifiers 9.0.0 - Modifiers for drag interactions

**State Management:**
- Zustand 5.0.11 - Lightweight state management library
- `src/core/editor/store.ts` - Editor state implementation

**Validation & Schema:**
- Zod 4.3.6 - Runtime schema validation
- `src/core/renderer/types.ts` - Layout and component schema definitions

**Utilities:**
- date-fns 4.1.0 - Date manipulation
- nanoid 5.1.6 - URL-friendly unique ID generation
- react-virtuoso 4.18.1 - Virtual scrolling for lists

**Authentication:**
- @supabase/supabase-js 2.94.0 - Supabase client SDK
- @supabase/ssr 0.8.0 - Server-side rendering utilities for Supabase auth
- Uses Supabase Auth for user authentication

**Storage & CDN:**
- cloudinary 2.9.0 - Image upload and management service
- @aws-sdk/client-s3 3.982.0 - AWS S3 client for cloud storage
- @aws-sdk/s3-request-presigner 3.982.0 - URL signing for S3 uploads

## Key Dependencies

**Critical:**
- Next.js 16.1.6 - Application runtime and API routes
- Drizzle ORM 0.45.1 - Database queries and migrations
- @supabase/supabase-js 2.94.0 - Authentication and user management
- cloudinary 2.9.0 - Image hosting and transformation

**Infrastructure:**
- postgres 3.4.8 - Direct PostgreSQL connection (used by Drizzle)
- @aws-sdk packages - S3 integration for file storage

## Configuration

**Environment:**
- `.env.local` - Local environment configuration (not committed)
- Configuration via process.env variables:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
  - `DATABASE_URL` - PostgreSQL connection string
  - `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud identifier
  - `CLOUDINARY_API_KEY` - Cloudinary API key
  - `CLOUDINARY_API_SECRET` - Cloudinary API secret
  - `NEXT_PUBLIC_CDN_URL` - Custom CDN base URL for image loading

**Build:**
- `tsconfig.json` - TypeScript compiler configuration
  - Target: ES2017
  - Module: ESNext
  - Path alias: `@/*` → `./src/*`
  - Strict mode enabled
- `next.config.ts` - Next.js configuration
  - React Compiler enabled for automatic memoization
  - Custom image loader via `src/lib/storage/image-loader.ts`
- `drizzle.config.ts` - Drizzle migration configuration
  - Schema location: `src/lib/db/schema.ts`
  - Output: `drizzle/` directory
  - Dialect: PostgreSQL

## Package Scripts

**Development:**
```bash
npm run dev      # Start Next.js dev server on 0.0.0.0:3000
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Platform Requirements

**Development:**
- Node.js v18 or higher (implicit from Next.js 16)
- npm or equivalent
- PostgreSQL database (for full functionality)
- Supabase account (for authentication)
- Cloudinary account (for image storage)
- AWS account (optional, for S3 integration)

**Production:**
- Vercel (recommended for Next.js) or Node.js hosting
- PostgreSQL database (production instance)
- Supabase project (production instance)
- Cloudinary account
- AWS S3 bucket (optional)

---

*Stack analysis: 2026-03-10*
