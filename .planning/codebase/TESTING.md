# Testing Patterns

**Analysis Date:** 2026-02-12

## Test Framework

**Runner:**
- Not detected: No test framework configured
- No `vitest.config.ts`, `jest.config.js`, or test-runner config found
- DevDependencies do not include Jest, Vitest, or similar

**Assertion Library:**
- Not detected: No assertion library installed

**Run Commands:**
- No test commands in `package.json` scripts
- Only available scripts: `dev`, `build`, `start`, `lint`

## Test File Organization

**Location:**
- No test files found in `/src` directory
- All test files discovered are in `node_modules` (dependency tests only)
- Codebase does not include test files for application code

**Naming:**
- Not applicable: No project test files exist
- Dependency test files follow pattern: `*.test.ts` or `*.spec.ts`

## Test Structure

**Suite Organization:**
- Not applicable: No test framework configured

## Current Testing Absence

**Why Tests Are Missing:**
- No test framework installed or configured
- No test files created for business logic, components, or API routes
- Early-stage project prioritizing feature development over testing

**Code Areas Needing Tests:**
1. **`src/core/editor/store.ts`** - Zustand store with complex state mutations
   - State updates: `setLayout()`, `selectItem()`, `updateItem()`, `addItem()`, `removeItem()`, `moveItem()`
   - Async operations: `saveLayout()` with fetch and error handling
   - Would benefit from unit tests verifying state transitions

2. **`src/lib/db/layouts.ts`** - Database operations
   - `getLayoutBySlug()` - Read operations with fallback
   - `upsertLayout()` - Write operations with validation
   - Would benefit from integration tests with database mocking

3. **`src/app/api/layouts/[slug]/route.ts`** - API endpoints
   - PUT handler with complex image cleanup logic
   - Error handling for validation and server errors
   - Would benefit from integration tests with request/response mocking

4. **`src/core/renderer/Renderer.tsx`** - React component
   - `renderItem()` function with conditional rendering
   - Different item types (image, text, spacer)
   - Would benefit from unit tests using React Testing Library

5. **`src/core/editor/EditorCanvas.tsx`** - Drag-and-drop canvas
   - Drag event handling integration with dnd-kit
   - Store integration
   - Would benefit from component tests

6. **`src/components/ContactForm.tsx`** - Form component
   - Form submission with async loading states
   - Animation timing
   - Would benefit from component tests with user interactions

## Mocking

**Framework:**
- Not configured: No mocking library installed
- Fetch API would require mocking (node-fetch or jest-fetch-mock for Node.js tests)
- Component testing would require React Testing Library or Vitest

**What Would Be Mocked:**
- Database client: `getDb()` should return mock database in tests
- External APIs: Cloudinary API, Supabase auth
- Fetch calls: Image uploads, layout saves
- Next.js Router: Navigation in page components
- Zustand store: For component isolation tests

**What NOT to Mock:**
- Pure utility functions: Calculate positions, string formatting
- Data validation: Zod schemas should be tested directly
- Component UI logic: DOM interactions should be tested with real components

## Fixtures and Factories

**Test Data:**
- Not implemented: No fixture or factory files exist
- Sample data available: `src/core/renderer/sample-layout.ts` contains sample layout structure suitable as fixture
  ```typescript
  // Could be used as test fixture:
  const sampleLayout: Layout = {
    id: "sample",
    slug: "sample",
    title: "Sample Portfolio",
    items: [
      // ... item samples
    ],
    updatedAt: new Date().toISOString(),
  };
  ```

**Location:**
- Would be located in `/src/__fixtures__/` or `tests/fixtures/`
- Consider creating: `/src/__fixtures__/layouts.ts` for test data builders

## Coverage

**Requirements:**
- Not enforced: No coverage threshold configured
- No coverage tooling (nyc, c8, etc.) installed

**Current State:**
- 0% coverage: No tests exist
- Critical paths untested: State management, API routes, form handling

## Test Types

**Unit Tests:**
- Not present
- Should test: Store actions, utility functions, type validation
- Could use: Vitest (lightweight) or Jest

**Integration Tests:**
- Not present
- Should test: API routes with database, Zustand store with components
- Could use: MSW (Mock Service Worker) for API mocking

**E2E Tests:**
- Not present
- Could use: Playwright or Cypress for editor interactions and form submissions
- Important for: Canvas drag-and-drop, authentication flows, image uploads

**Component Tests:**
- Not present
- Should test: React component rendering, user interactions
- Could use: React Testing Library + Vitest

## Async Testing Patterns

**Current Code Pattern (No Test Framework):**
```typescript
// From ContactForm.tsx - simulating async operations:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  // Simulate sending
  await new Promise((resolve) => setTimeout(resolve, 2000));

  setLoading(false);
  setSuccess(true);
};
```

**Recommended Test Pattern (Once Framework Installed):**
```typescript
// Would look like:
it("should show loading state during submission", async () => {
  // render component
  // user.click(submitButton)
  // expect(loadingState).toBeVisible()
  // await waitFor(() => expect(successMessage).toBeVisible())
});
```

**Store Async Testing Pattern:**
```typescript
// From store.ts - saveLayout() would be tested like:
// await act(async () => {
//   await store.getState().saveLayout()
// })
// expect(store.getState().hasUnsavedChanges).toBe(false)
```

## Error Testing

**Current Patterns in Code:**
- Try-catch blocks catch errors but don't test error cases
- API routes return error responses but untested
- Store catches save errors and shows alert: `alert("Error al guardar los cambios")`

**Recommended Error Testing Pattern:**
```typescript
// API error testing:
describe("PUT /api/layouts/[slug]", () => {
  it("should return 400 for slug mismatch", async () => {
    const res = await PUT(request, { params: { slug: "old" } });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Slug mismatch");
  });

  it("should handle ZodError validation", async () => {
    // mock invalid JSON response
    expect(res.status).toBe(400);
  });
});

// Store error testing:
describe("useEditorStore", () => {
  it("should handle save errors gracefully", async () => {
    // mock fetch to reject
    await store.getState().saveLayout();
    // verify error was logged
    // verify hasUnsavedChanges remains true
  });
});
```

## Recommended Testing Setup

**To Add Testing to This Project:**

1. **Install Testing Framework:**
   ```bash
   npm install -D vitest @vitest/ui @vitest/coverage-v8
   npm install -D @testing-library/react @testing-library/jest-dom
   npm install -D jsdom
   ```

2. **Create `vitest.config.ts`:**
   ```typescript
   import { defineConfig } from "vitest/config";
   import react from "@vitejs/plugin-react";

   export default defineConfig({
     plugins: [react()],
     test: {
       globals: true,
       environment: "jsdom",
       coverage: {
         provider: "v8",
         reporter: ["text", "json"],
       },
     },
   });
   ```

3. **Add Test Scripts to `package.json`:**
   ```json
   "test": "vitest",
   "test:ui": "vitest --ui",
   "test:coverage": "vitest --coverage"
   ```

4. **Create Test Directories:**
   - `/src/__tests__/` - Unit tests
   - `/src/__fixtures__/` - Test data
   - `/src/app/api/__tests__/` - API route tests

5. **Priority Test Files to Create:**
   - `/src/__tests__/core/editor/store.test.ts` - Store logic (highest impact)
   - `/src/__tests__/lib/db/layouts.test.ts` - Database operations
   - `/src/app/api/__tests__/layouts.route.test.ts` - API endpoints
   - `/src/__tests__/components/ContactForm.test.tsx` - Form component

---

*Testing analysis: 2026-02-12*
