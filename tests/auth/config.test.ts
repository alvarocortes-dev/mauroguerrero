import { describe, it, expect, vi } from "vitest";

// Mock the database and external services before importing auth
vi.mock("@/lib/db", () => ({
  db: {},
}));
vi.mock("resend", () => {
  return {
    Resend: class MockResend {
      emails = { send: vi.fn() };
    },
  };
});

describe("AUTH-01: better-auth config", () => {
  it("auth instance has getSession API", async () => {
    // Set required env vars for the test
    process.env.BETTER_AUTH_SECRET = "test-secret-minimum-32-chars-long!!";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";

    const { auth } = await import("@/lib/auth/config");
    expect(auth.api.getSession).toBeTypeOf("function");
  });
});
