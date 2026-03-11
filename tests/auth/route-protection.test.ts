import { describe, it, expect } from "vitest";

describe("AUTH-04: route protection", () => {
  it("TODO: GET /api/layouts/[slug] without session cookie returns 401", () => {
    // Test the actual Next.js route handler by importing it and calling it
    // without session headers — expect 401 response.
    // Will import: import { GET } from "@/app/api/layouts/[slug]/route"
    // Create Request without auth headers, call GET, expect status 401
    expect(true).toBe(false); // RED — implementation in Plan 05
  });

  it("TODO: PUT /api/layouts/[slug] without session cookie returns 401", () => {
    // Test the actual Next.js route handler by importing it and calling it
    // without session headers — expect 401 response.
    // Will import: import { PUT } from "@/app/api/layouts/[slug]/route"
    // Create Request without auth headers, call PUT, expect status 401
    expect(true).toBe(false); // RED — implementation in Plan 05
  });
});
