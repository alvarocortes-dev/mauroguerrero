import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { magicLinkClient } from "better-auth/client/plugins";
import { multiSessionClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "",
  plugins: [
    twoFactorClient(),
    magicLinkClient(),
    multiSessionClient(),
  ],
});
