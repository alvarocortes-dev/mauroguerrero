import { describe, it, expect } from "vitest";

describe("AUTH-02: magic link authentication", () => {
  it("TODO: Resend send is called with correct from, to, subject fields when sendMagicLink fires", () => {
    // Will mock Resend and test: import { auth } from "@/lib/auth/config"
    // Call auth.api.signInMagicLink with test email
    // Verify Resend.emails.send was called with { from, to, subject }
    expect(true).toBe(false); // RED — implementation in Plan 03
  });
});
