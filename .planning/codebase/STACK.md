# Technology Stack

**Analysis Date:** 2026-02-12

## Languages

**Primary:**
- TypeScript 5 - All source code, configuration files, and type definitions

**Secondary:**
- JavaScript - Package configuration and build scripts
- CSS - Global styles via Tailwind CSS

## Runtime

**Environment:**
- Node.js (version specified via package.json dependencies)

**Package Manager:**
- npm 10+ (lockfileVersion 3 in package-lock.json)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework for web application
- React 19.2.3 - UI component library
- React DOM 19.2.3 - React rendering for web

**Styling:**
- Tailwind CSS 4 - Utility-first CSS framework
- PostCSS 4 (via @tailwindcss/postcss) - CSS transformations

**Database & ORM:**
- Drizzle ORM 0.45.1 - TypeScript-first SQL ORM
- Drizzle Kit 0.31.8 - Drizzle migrations and schema management
- PostgreSQL via postgres 3.4.8 - Direct SQL client for Node.js

**Rich Text Editing:**
- Tiptap 3.19.0 - Headless WYSIWYG editor (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`)

**Drag & Drop:**
- dnd-kit 6.3.1+ - Accessible drag-and-drop library (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`)

**Animation:**
- Framer Motion 12.31.0 - React animation library

**State Management:**
- Zustand 5.0.11 - Lightweight state management

**Data Validation:**
- Zod 4.3.6 - TypeScript-first schema validation

**Authentication:**
- @supabase/supabase-js 2.94.0 - Supabase client SDK
- @supabase/ssr 0.8.0 - Server-side rendering helpers for Supabase

**File Storage:**
- Cloudinary 2.9.0 - Cloud image storage and manipulation SDK
- @aws-sdk/client-s3 3.982.0 - AWS S3 client SDK
- @aws-sdk/s3-request-presigner 3.982.0 - Presigned URL generation for S3

**UI Components & Icons:**
- Lucide React 0.563.0 - React icon library

**Utilities:**
- date-fns 4.1.0 - Date utility library
- nanoid 5.1.6 - Unique ID generator
- react-virtuoso 4.18.1 - Virtual scroll component for large lists

## Testing

**Framework:** Not configured

**Build & Dev:**
- ESLint 9 - Linting
- @types/node 20, @types/react 19, @types/react-dom 19 - Type definitions
- Babel React Compiler 1.0.0 - Optimizing React compiler
- dotenv 17.2.3 - Environment variable loading

## Key Dependencies

**Critical:**
- Drizzle ORM (0.45.1) - Database schema management and migrations
- Supabase SDK (2.94.0) - Authentication and real-time features
- Cloudinary (2.9.0) - Image storage and CDN
- Tiptap (3.19.0) - Editor core functionality

**Infrastructure:**
- Next.js 16.1.6 - Full application runtime
- dnd-kit 6+ - Drag-and-drop interactions for portfolio editor
- AWS SDK S3 packages - Optional file storage backend

## Configuration

**Environment:**

Configuration via environment variables in `.env.local`:
- `CLOUDINARY_CLOUD_NAME` - Cloudinary account identifier
- `CLOUDINARY_API_KEY` - Cloudinary API authentication
- `CLOUDINARY_API_SECRET` - Cloudinary secret key (server-side only)
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (exposed to client)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public API key (exposed to client)
- `NEXT_PUBLIC_CDN_URL` - CDN endpoint for image optimization

**Build:**

Configuration files:
- `next.config.ts` - Next.js application settings (React compiler enabled, custom image loader)
- `tsconfig.json` - TypeScript compiler options (strict mode, path aliases `@/*` → `src/*`)
- `drizzle.config.ts` - Drizzle schema and migration settings
- `eslint.config.mjs` - ESLint configuration (Next.js core and TypeScript rules)
- `postcss.config.mjs` - PostCSS configuration for Tailwind CSS

## Platform Requirements

**Development:**
- Node.js (compatible with npm 10+)
- PostgreSQL database server
- Cloudinary account for image storage
- Supabase project for authentication
- Optional: AWS S3 bucket for file storage

**Production:**
- Vercel (Next.js optimized deployment) or any Node.js hosting
- PostgreSQL database (remote)
- Cloudinary API credentials
- Supabase project (authentication service)

---

*Stack analysis: 2026-02-12*
