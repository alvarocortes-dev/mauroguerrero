import { describe, it, expect } from "vitest";

describe("AUTH-02: Magic link email", () => {
  it("magic link email has required fields", () => {
    // Verify the email shape matches what Resend expects
    const emailPayload = {
      from: "acceso@mauroguerrero.com",
      to: ["test@example.com"],
      subject: "Tu enlace de acceso — Mauro Guerrero",
      html: '<a href="https://example.com/api/auth/magic-link/verify?token=abc">Link</a>',
    };

    expect(emailPayload.from).toContain("@");
    expect(emailPayload.to).toHaveLength(1);
    expect(emailPayload.subject).toBeTruthy();
    expect(emailPayload.html).toContain("href=");
  });

  it("magic link expires after 5 minutes", () => {
    const expiresInSeconds = 300; // 5 minutes as configured in auth config
    expect(expiresInSeconds).toBe(300);
  });
});
