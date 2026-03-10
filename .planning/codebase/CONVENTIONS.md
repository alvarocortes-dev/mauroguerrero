# Coding Conventions

**Analysis Date:** 2026-03-10

## Naming Patterns

**Files:**
- React components (`.tsx`) use PascalCase: `ContactForm.tsx`, `Modal.tsx`, `ThemeToggle.tsx`
- Utility/logic files (`.ts`) use camelCase: `cloudinary.ts`, `schema.ts`, `client.ts`
- Page routes use lowercase: `page.tsx`, `route.ts`
- Store files: `store.ts` for Zustand state management

**Functions:**
- Components are PascalCase: `export function ContactForm()`, `export const Toolbar = ()`
- Hooks are camelCase with `use` prefix: `useEditorStore()`, `useState()`, `useEffect()`
- Utility/API functions are camelCase: `getLayoutBySlug()`, `upsertLayout()`, `generateSignature()`, `deleteImage()`
- Event handlers are camelCase with `handle` prefix: `handleSubmit()`, `handleImageUpload()`

**Variables:**
- State variables use camelCase: `selectedId`, `isSaving`, `hasUnsavedChanges`, `loading`, `success`
- Constants use camelCase or UPPER_SNAKE_CASE depending on scope
- Loop variables: `item`, `i`, `id` (short, conventional names)

**Types:**
- TypeScript interfaces use PascalCase: `interface EditorState`, `interface ModalProps`, `interface LayoutProps`
- Zod schemas use camelCase with `Schema` suffix: `layoutSchema`, `layoutItemSchema`, `layoutImageSchema`
- Type inference from Zod: `export type Layout = z.infer<typeof layoutSchema>`

## Code Style

**Formatting:**
- ESLint 9 with Next.js recommended config (`eslint-config-next`)
- No explicit Prettier config found - uses ESLint formatting
- Indent: 2 spaces (TypeScript default)
- Line length: No strict limit observed, pragmatic breaking

**Linting:**
- Config: `eslint.config.mjs` (flat config format)
- Extends: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Disables default ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`
- Run with: `npm run lint`

**Typewriter Settings:**
- Strict mode enabled
- Target: ES2017
- Module: esnext
- JSX: react-jsx
- Path alias: `@/*` maps to `./src/*`

## Import Organization

**Order:**
1. External libraries (React, Next.js, third-party packages)
2. Internal imports using path alias `@/`
3. Types/interfaces from `@/` imports

**Example from `src/core/editor/store.ts`:**
```typescript
import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Layout, LayoutItem } from "@/core/renderer/types";
import { arrayMove } from "@dnd-kit/sortable";
```

**Example from `src/core/renderer/Renderer.tsx`:**
```typescript
import Image from "next/image";
import { motion } from "framer-motion";
import type { Layout, LayoutItem } from "./types";
```

**Path Aliases:**
- `@/` always refers to `./src/`
- Relative imports used when within the same directory level
- Absolute path imports preferred for cross-directory navigation

## Error Handling

**Patterns:**

1. **Try-Catch Blocks with Console Logging:**
   - Found in async functions and API routes
   - `console.error()` for errors: `console.error("Error saving layout:", error)`
   - `console.warn()` for degraded service: `console.warn("Database error, falling back to sample layout:", error)`

2. **Silent Failures with Fallbacks:**
   - Database operations fall back to `sampleLayout` if database unavailable
   - Image deletion in Cloudinary continues even if delete fails: `catch (err) { console.error(...); }`
   - File: `src/lib/db/layouts.ts`

3. **HTTP Error Handling in API Routes:**
   - Check response status: `if (!response.ok) { throw new Error(...) }`
   - Return NextResponse.json with status codes: `NextResponse.json({error: "..."}, {status: 400})`
   - File: `src/app/api/layouts/[slug]/route.ts`

4. **Zod Validation Errors:**
   - Catch ZodError separately: `if (error instanceof z.ZodError)`
   - Return validation details to client
   - File: `src/app/api/layouts/[slug]/route.ts` line 60-65

5. **UI Error Handling:**
   - Show user-friendly alerts: `alert("Error al guardar los cambios")`
   - Log detailed errors to console for debugging
   - File: `src/core/editor/store.ts` line 141-142

## Logging

**Framework:** `console` object (native)

**Patterns:**
- `console.log()` for informational logs: `console.log("Deleting image...")`
- `console.error()` for error conditions: `console.error("Error:", error)`
- `console.warn()` for warnings/degradation: `console.warn("Database error...")`
- Logs include context: `console.error("Error saving layout:", error)`

**Usage:**
- Async/await error boundaries: all try-catch blocks log errors
- API route logging: request success/failure states
- Client-side state updates: minimal logging, mostly errors

## Comments

**When to Comment:**
- Rarely used in this codebase - code is generally self-documenting
- Comments appear only for non-obvious logic or API requirements
- Example: `// I need an API endpoint for getting the upload URL.` (PropertiesPanel.tsx line 4)

**JSDoc/TSDoc:**
- Not used in source files
- Type annotations preferred over JSDoc comments

## Function Design

**Size:** Functions average 20-100 lines, typically smaller
- Largest: `PropertiesPanel` (190 lines) - full component with nested logic
- Typical utility function: 5-30 lines
- Store actions: 10-20 lines with internal state management

**Parameters:**
- Zustand store actions: single parameter or destructured object
- React components: destructured props with TypeScript interface
- API routes: `request` and `{ params }` with type `Promise<{...}>`
- Example: `async (item: LayoutItem) => { ... }`

**Return Values:**
- React components: JSX.Element
- Async functions: Promise of expected type
- Store actions: return result of `set()` or mutation object
- Fallible operations return nullable types or throw errors

## Module Design

**Exports:**
- Named exports preferred: `export const functionName = () => {}`
- Default exports for React pages/components: `export default function HomePage()`
- Type-only exports: `export type Layout = z.infer<typeof layoutSchema>`

**Barrel Files:**
- Not used in this codebase - imports are direct to files
- Example: import from `@/core/editor/store.ts` not `@/core/editor/`

**File Organization:**
- One primary export per file (component + helpers together)
- Schema/type definitions in separate `.ts` files
- Store definitions in `store.ts` with all actions included

## Tailwind CSS

**Usage:**
- Inline utility classes on all elements
- Dark mode support with `dark:` prefix: `bg-white dark:bg-black`
- Spacing: `gap-2`, `gap-4`, `gap-6`, `p-2`, `p-4`, `p-6`
- Responsive: `max-w-sm`, `w-full`, `h-auto`
- Custom styling via CSS variables in `globals.css` (open-props easings)

**Patterns:**
- Conditional classes with template literals: `` `${base} ${condition ? 'active' : 'inactive'}` ``
- Motion/animation integration with Framer Motion: motion-enabled divs with animations

## TypeScript

**Strict Mode:** Enabled (`"strict": true`)

**Type Usage:**
- Interfaces for component props: `interface ModalProps { ... }`
- Type inference from Zod: `type Layout = z.infer<typeof layoutSchema>`
- Union types for discriminated unions: `z.union([imageSchema, textSchema, spacerSchema])`
- Generic types: `create<EditorState>(...)`, `z.object<{...}>()`

---

*Convention analysis: 2026-03-10*
