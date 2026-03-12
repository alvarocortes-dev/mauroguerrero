import { describe, it, expect } from "vitest";
import { mockSession } from "../helpers/auth";

describe("AUTH-05: Session management", () => {
  it("session object has required fields for UI display", () => {
    // Verify the session shape has all fields needed by SessionManager
    expect(mockSession).toHaveProperty("id");
    expect(mockSession).toHaveProperty("userAgent");
    expect(mockSession).toHaveProperty("ipAddress");
    expect(mockSession).toHaveProperty("createdAt");
    expect(mockSession).toHaveProperty("expiresAt");
  });

  it("session expiry is 30 days from creation", () => {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const diff =
      mockSession.expiresAt.getTime() - mockSession.createdAt.getTime();
    // Allow 1 second tolerance for test execution time
    expect(diff).toBeGreaterThanOrEqual(thirtyDaysMs - 1000);
    expect(diff).toBeLessThanOrEqual(thirtyDaysMs + 1000);
  });
});
