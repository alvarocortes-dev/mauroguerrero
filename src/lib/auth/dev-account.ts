import { timingSafeEqual, scryptSync } from "crypto";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function validateDevCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const devEmail = process.env.DEV_EMAIL;
  const devPasswordHash = process.env.DEV_PASSWORD_HASH; // format: "salt:hash"

  if (!devEmail || !devPasswordHash) return false;

  // Constant-time email comparison
  let emailMatch = false;
  try {
    emailMatch = timingSafeEqual(
      Buffer.from(email.toLowerCase()),
      Buffer.from(devEmail.toLowerCase())
    );
  } catch {
    return false; // different lengths will throw
  }

  if (!emailMatch) return false;

  // Validate scrypt hash (format: "salt:hash")
  const [salt, storedHash] = devPasswordHash.split(":");
  if (!salt || !storedHash) return false;

  try {
    const candidateHash = scryptSync(password, salt, 64).toString("hex");
    const isPasswordValid = timingSafeEqual(
      Buffer.from(candidateHash),
      Buffer.from(storedHash)
    );
    return isPasswordValid;
  } catch {
    return false;
  }
}

/**
 * Ensure the dev user record exists in the DB.
 * The dev user has no passwordHash stored — auth is via env var validation.
 * Call this during application startup or on first dev login.
 */
export async function ensureDevUserExists(): Promise<void> {
  const devEmail = process.env.DEV_EMAIL;
  if (!devEmail) return;

  const existing = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, devEmail))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userTable).values({
      id: `dev-${Date.now()}`,
      email: devEmail,
      name: "Dev Admin",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
