// Mock session object matching better-auth session shape
export const mockSession = {
  id: "test-session-id",
  userId: "test-user-id",
  token: "test-token",
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  ipAddress: "127.0.0.1",
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
};

export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  twoFactorEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};
