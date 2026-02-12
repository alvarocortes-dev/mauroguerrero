# Coding Conventions

**Analysis Date:** 2026-02-12

## Naming Patterns

**Files:**
- React Components: PascalCase (e.g., `ContactForm.tsx`, `ThemeToggle.tsx`)
- Server utilities: camelCase (e.g., `client.ts`, `layouts.ts`, `schema.ts`)
- Stores: camelCase with "store" suffix (e.g., `store.ts` for Zustand)
- API routes: Follow Next.js convention (e.g., `route.ts` in `[slug]/` directories)
- Configuration: lowercase with dots (e.g., `drizzle.config.ts`, `next.config.ts`)

**Functions:**
- camelCase for all functions: `getDb()`, `getLayoutBySlug()`, `upsertLayout()`, `renderItem()`
- Event handlers: camelCase with "handle" prefix in components: `handleSubmit()`, `handleDragStart()`, `handleDragEnd()`, `onClick()`
- Async functions: camelCase with `async` keyword: `async getLayoutBySlug()`, `async upsertLayout()`
- Exported store functions: camelCase: `useEditorStore()`

**Variables:**
- camelCase for local variables: `layout`, `selectedId`, `activeId`, `newTheme`, `theme`
- Const declarations for state/store accessors: `const { layout, moveItem } = useEditorStore()`
- State setters: camelCase with "set" prefix in components: `setLoading()`, `setSuccess()`, `setTheme()`

**Types:**
- PascalCase for interfaces and type definitions: `EditorState`, `RendererProps`, `Layout`, `LayoutItem`, `LayoutImageSchema`
- Type inference from Zod: `type Layout = z.infer<typeof layoutSchema>`
- Generic type parameters: PascalCase single letters acceptable: `T`

**Constants:**
- UPPER_SNAKE_CASE for configuration constants
- camelCase for computed/derived constants: `storageKey = "theme-preference"`

**Database:**
- Table names: lowercase plural (e.g., `layouts`)
- Column names: camelCase (e.g., `updatedAt`, `publicId`)
- Schema exports: lowercase (e.g., `layouts` table)

## Code Style

**Formatting:**
- No explicit Prettier config found; uses Next.js defaults
- 2-space indentation (inferred from codebase)
- Semicolons required at end of statements
- Single quotes not observed; uses double quotes consistently
- Line length: No strict limit observed; varies but averages 80-100 characters

**Linting:**
- ESLint v9 configured via `eslint.config.mjs` (flat config)
- Uses `eslint-config-next` with core-web-vitals and TypeScript support
- Pragmatic eslint-disable comments for specific violations: `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
- Ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

**React/JSX:**
- No format restrictions observed; components use standard JSX with className
- Event handlers: Use arrow functions passed to JSX attributes
- Fragment shorthand: Not commonly used; explicit wrapper divs used instead
- Component exports: Named exports preferred: `export const ContactForm = ()`
- Component functions: PascalCase arrow functions or regular functions

## Import Organization

**Order:**
1. External library imports (React, Next.js, UI libraries): `import { useState } from "react"`, `import { create } from "zustand"`
2. Next.js specific imports: `import { NextRequest, NextResponse } from "next/server"`
3. Internal absolute imports using `@/` alias: `import { useEditorStore } from "@/core/editor/store"`
4. Internal relative imports (rarely used): Prefer absolute `@/` imports
5. Type imports: Mixed with regular imports; no segregation: `import type { Layout } from "@/core/renderer/types"`

**Path Aliases:**
- `@/*` → `./src/*` (configured in `tsconfig.json`)
- All imports should use `@/` prefix for files within `src/` directory
- No other aliases defined

**Import Examples from Codebase:**
```typescript
// External libraries
import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Layout, LayoutItem } from "@/core/renderer/types";
import { arrayMove } from "@dnd-kit/sortable";

// Next.js
import { NextRequest, NextResponse } from "next/server";

// Internal absolute imports
import { getDb } from "./client";
import { layouts } from "./schema";
import { useEditorStore } from "./store";

// Type imports in same statement
import type { Layout } from "@/core/renderer/types";
```

**Barrel Files:**
- Not extensively used; direct imports from source files preferred
- Example: `src/core/renderer/types.ts` exports types directly without re-export barrel

## Error Handling

**Patterns:**
- Try-catch blocks used around async operations: database calls, API requests, image uploads
- Error logging: `console.error()` for errors, `console.warn()` for recoverable failures
- Error types checked with `instanceof` before accessing error properties: `if (error instanceof z.ZodError)`
- Fallback values: Database errors fall back to `sampleLayout`; upload errors use `alert()` for user feedback
- API errors: Wrapped in NextResponse with appropriate HTTP status codes (400, 500)
- Promise.all() with error handling for parallel operations (e.g., image deletion):
  ```typescript
  await Promise.all(
    removedImages.map(async (item) => {
      try {
        // operation
      } catch (err) {
        console.error(`Failed to...`, err);
        // Continue even if fails
      }
    })
  );
  ```

**Error Response Pattern (API Routes):**
- Validation errors (400): `NextResponse.json({ error: errors }, { status: 400 })`
- Server errors (500): `NextResponse.json({ error: "Internal Server Error" }, { status: 500 })`
- Type-specific errors checked: Zod parsing errors detected and returned as validation errors

## Logging

**Framework:** `console` API only
- `console.error()` for error conditions that require attention
- `console.warn()` for recoverable issues or deprecation
- `console.log()` not observed in committed code
- No structured logging or log levels configured

**Patterns:**
- Error context included: `console.error("Error saving layout:", error)`
- Image operations logged: `console.log('Deleting image ${item.publicId} from Cloudinary')`
- Warnings include fallback context: `console.warn("Database error, falling back to sample layout:", error)`

## Comments

**When to Comment:**
- Algorithm steps in complex operations: `// 1. Get existing layout`, `// 2. Identify removed images`, `// 3. Delete from Cloudinary`
- Placeholder intentions: `// Placeholder` for temporary image URLs
- Known limitations: `// In a real app, we would fetch the layout from the API here`
- Temporary workarounds: `// Continue even if delete fails`
- Linting overrides with context: `// eslint-disable-next-line @typescript-eslint/no-explicit-any`

**JSDoc/TSDoc:**
- Not extensively used in this codebase
- Type annotations preferred over JSDoc for documentation
- Interface comments not observed

**Comment Style:**
- Single-line comments: `// Comment`
- No multi-line block comments observed
- Inline comments avoided; prefer named variables for clarity

## Function Design

**Size:**
- Functions are kept relatively small and focused
- Store actions in Zustand: 5-20 lines typically
- API route handlers: 20-40 lines with error handling
- Helper functions: 5-15 lines

**Parameters:**
- Destructuring used for object parameters: `{ params }: { params: Promise<{ slug: string }> }`
- Type annotations required for all parameters in TS files
- Callback functions use explicit types: `onSelect?: (id: string) => void`

**Return Values:**
- Explicit return type annotations required
- Async functions return `Promise<Type>`
- Optional returns indicated with `| null` or `| undefined`
- Early returns for guard clauses: `if (!layout) return state;`

**Zustand Store Pattern:**
- State defined as interface
- Actions defined within interface before store creation
- Store created with factory function: `create<EditorState>((set, get) => ({ ... }))`
- Actions use `set()` for immutable updates
- Complex updates use spread operator: `{ ...item, ...updates }`

## Module Design

**Exports:**
- Named exports preferred: `export const getLayoutBySlug = (...)`
- Default exports rare; not observed in current codebase
- Re-exports not commonly used; direct imports preferred
- Function exports consistent with their usage: server functions exported as-is, React components as named exports

**Barrel Files:**
- Not commonly used; direct imports preferred
- `src/core/renderer/types.ts` exports multiple related types for consumption elsewhere
- No index.ts barrel files observed in main source

**File Organization:**
- Server-only utilities in `/lib/` directories with logical grouping: `/db/`, `/auth/`, `/storage/`
- Client components marked with `"use client"` directive at top
- Logic files organized by feature: `/core/editor/`, `/core/renderer/`
- Shared components in `/components/`

---

*Convention analysis: 2026-02-12*
