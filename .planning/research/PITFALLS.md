# Pitfalls Research

**Domain:** Photography portfolio with block grid editor, R2 storage, self-hosted auth, and image protection
**Researched:** 2026-03-10
**Confidence:** HIGH (critical security items verified against CVE disclosures and official docs; MEDIUM on grid editor specifics where dnd-kit issues are from GitHub issues, not official docs)

---

## Critical Pitfalls

### Pitfall 1: Middleware-Only Auth Allows Route Bypass (CVE-2025-29927)

**What goes wrong:**
Protecting `/editor` routes exclusively through Next.js middleware means a single spoofed HTTP header bypasses all authentication — including 2FA. An attacker sends `x-middleware-subrequest: src/middleware:src/middleware:...` and the middleware is skipped entirely. The current codebase does exactly this: Supabase auth enforced only at the middleware layer.

**Why it happens:**
Middleware feels like a complete solution because it runs on every request. Developers assume the edge network protects the header — it doesn't unless explicitly blocked upstream.

**How to avoid:**
Defense-in-depth: middleware is the first gate, not the only one. Every API route and Server Component that handles sensitive data must independently verify the session. Never trust the presence of middleware alone. Block the `x-middleware-subrequest` header at Cloudflare/Vercel edge before requests reach the app. Update Next.js to ≥15.2.3 (the fix version for this CVE).

**Warning signs:**
- `/editor` protection lives only in `middleware.ts` with no server-side session check inside the route handlers
- API routes do not call `auth()` or `getServerSession()` independently
- No Cloudflare rule blocking `x-middleware-subrequest` header

**Phase to address:** Auth Migration phase — must be the first thing fixed, before 2FA adds a false sense of security on top of a bypassed gate.

---

### Pitfall 2: TOTP Secret Stored Plaintext in Database

**What goes wrong:**
The TOTP secret (the seed for the authenticator app QR code) is stored as a raw string in the database. If the database is ever read (SQL injection, leaked backup, compromised hosting credentials), every 2FA secret is immediately usable. This is critical for a photographer who has already been hacked.

**Why it happens:**
Tutorial implementations store the secret directly. Libraries like `otplib` generate a string and developers store that string without a second thought.

**How to avoid:**
Encrypt TOTP secrets at rest using AES-256-GCM before inserting into the database. Store the encryption key in an environment variable, not in the codebase. Use backup codes (hashed with bcrypt, one-use) as the recovery path. Rate-limit TOTP verification attempts (max 5/minute) to prevent brute force — there are only 1,000,000 possible 6-digit codes.

**Warning signs:**
- `totpSecret` column is a plain `text` type in the Drizzle schema with no encryption wrapper
- No `totpSecretIv` or `totpSecretTag` column (required for authenticated encryption)
- No rate limiting middleware on the TOTP verify endpoint

**Phase to address:** Auth Migration phase — do this before enabling 2FA enrollment.

---

### Pitfall 3: Uploading Images Through the Vercel Serverless Function

**What goes wrong:**
Routing photo uploads through a Next.js API route (`/api/upload`) on Vercel hits the 4.5 MB body size limit immediately. A single RAW export or high-res JPEG from a modern camera is 20–50 MB. The upload fails with `413: FUNCTION_PAYLOAD_TOO_LARGE` with no meaningful error shown to the photographer.

**Why it happens:**
The existing Cloudinary integration uses server-side signing, where the file is sent to the API route which then proxies it to Cloudinary. This worked because Cloudinary's SDK handles chunking. Raw S3-compatible uploads to R2 through the same pattern will fail.

**How to avoid:**
Use presigned URLs for direct client-to-R2 uploads. The API route generates a presigned PUT URL (metadata only, no file bytes). The browser uploads directly to R2 using that URL. The API route then receives a completion callback and triggers server-side processing (resize, watermark, EXIF). This completely bypasses the 4.5 MB limit.

**Warning signs:**
- Any code path that accepts a `multipart/form-data` body with a file in a Vercel API route and then calls `r2.putObject(...)` with the file body
- No presigned URL generation endpoint in the R2 migration plan

**Phase to address:** Photo Management / R2 Migration phase — design the upload flow presigned-first before writing any upload UI.

---

### Pitfall 4: R2 CORS Misconfiguration Silently Breaks Browser Uploads

**What goes wrong:**
Presigned PUT URLs require a matching CORS policy on the R2 bucket. Without it, the browser's preflight OPTIONS request fails and the upload errors with a cryptic CORS message. Two sub-mistakes compound this: (1) configuring CORS via the Cloudflare dashboard instead of Wrangler CLI (dashboard CORS only applies to public URLs, not API endpoints), and (2) using wildcards in `AllowedHeaders` which causes `403 Forbidden` on the actual PUT.

**Why it happens:**
The Cloudflare dashboard makes CORS look configured when it isn't — it applies to a different request path than the S3-compatible API used for presigned uploads. The Wrangler CLI uses a different JSON schema than what the UI shows.

**How to avoid:**
Configure R2 CORS exclusively via Wrangler CLI (`wrangler r2 bucket cors put`). Set `AllowedOrigins` to the exact production and development origins. Set `AllowedHeaders` to `["content-type", "x-amz-*"]` explicitly — no wildcards. Test CORS configuration before building any upload UI by issuing a raw `curl` preflight.

**Warning signs:**
- CORS configured through the Cloudflare web dashboard rather than Wrangler
- `AllowedHeaders: ["*"]` in the CORS config
- Upload works in Postman but fails in browser

**Phase to address:** R2 Migration phase — configure and verify CORS before writing upload code.

---

### Pitfall 5: dnd-kit Variable-Size Block Collision Detection Breaks Grid Integrity

**What goes wrong:**
dnd-kit's default collision detection algorithms assume uniform item sizes. When blocks have different spans (e.g., a 2x5 block next to a 1x1 block), the collision detection measures only the first item's dimensions and applies them to all items. Dragging a wide block into a column of narrow blocks produces wrong drop targets, phantom overlaps, and layout corruption. This is a confirmed open issue in the dnd-kit GitHub tracker (issues #720, #813, #1605).

**Why it happens:**
dnd-kit is a toolkit, not a pre-built grid editor. Its built-in collision algorithms (`closestCenter`, `closestCorners`) work correctly for lists and uniform grids but are documented as needing customization for variable-size scenarios.

**How to avoid:**
Implement a custom collision detection algorithm that accounts for block span dimensions. Track the grid cell coordinate system (col, row, colSpan, rowSpan) independently of DOM positions. On drag, compute which cells the dragged block would occupy at the pointer position and check for occupancy conflicts before committing the drop. Use an occupancy matrix (2D array of block IDs) as the source of truth, not DOM rect measurements.

**Warning signs:**
- Using `closestCenter` or `closestCorners` collision detection on a grid with mixed-size blocks
- Grid state stored as a flat array of items without explicit `col`/`row`/`colSpan`/`rowSpan` coordinates
- No occupancy matrix validation before state commits

**Phase to address:** Grid Editor phase — design the grid data model with explicit coordinates from the start; retrofitting is expensive.

---

### Pitfall 6: Content Protection Creates a False Sense of Security That Delays Real Protection

**What goes wrong:**
Right-click disabling, CSS `pointer-events: none`, `user-select: none`, and invisible overlays are bypassed in under 60 seconds by anyone who opens DevTools and runs `document.querySelectorAll('img').forEach(img => img.src)`. The photographer believes images are protected; they are not. The real protection is never delivering full-resolution bytes to the browser in the first place.

**Why it happens:**
CSS protection is easy to implement and feels comprehensive. Developers add the overlay and checkbox the feature as done. The fundamental issue — that a browser must receive image bytes to display them — is architecturally invisible.

**How to avoid:**
Serve only low-resolution previews (e.g., 1200px wide, 80% JPEG quality) to public visitors via signed URLs. Full-resolution files live in R2 under a private bucket — never served directly. The visible watermark is burned into the image server-side by Sharp before the preview is generated and stored. CSS protections (right-click, drag, overlay) are a deterrent for casual users only — implement them but do not rely on them. DevTools detection is a deterrent, not a lock.

**Warning signs:**
- `<img src="https://pub-xxxx.r2.dev/full-res/photo.jpg" />` — public R2 URL serving full resolution
- Watermark implemented as a CSS overlay rather than burned into the image file
- Protection checklist completed without a "can I wget all images?" test

**Phase to address:** Content Protection phase — but the prerequisite decision (serve only low-res, burn watermarks) must be made during the Photo Management phase before upload architecture is finalized.

---

### Pitfall 7: Undo/Redo History in Zustand Grows Without Bound

**What goes wrong:**
The existing Zustand editor store has no undo/redo. Adding it naively — pushing every state change onto a history array — causes memory exhaustion in long editing sessions. Every block drag, every text keystroke, every resize event creates a snapshot. A photographer spending an hour laying out a project generates thousands of history entries.

**Why it happens:**
Undo/redo tutorials show the concept with a small array. Production requirements (debouncing, history limits, selective snapshot events) are not covered.

**How to avoid:**
Snapshot history only on discrete intentional actions: drop completed, resize handle released, text field blurred. Not on intermediate drag positions or every keystroke. Cap history at 50 snapshots. Use Zustand middleware (`temporal` from `zundo`) to manage history slices rather than hand-rolling — it handles the snapshot/restore pattern correctly. Debounce text input snapshots with a 500ms delay.

**Warning signs:**
- History array grows on `onDragMove` or `onChange` events rather than `onDragEnd` / `onBlur`
- No `maxHistorySize` cap in the store
- Undo triggers rerender on every intermediate drag position

**Phase to address:** Grid Editor phase — wire up undo/redo infrastructure before building block types, not after.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store TOTP secret plaintext | Simpler implementation | Full 2FA compromise if DB is read | Never |
| CSS-only content protection | Fast to implement | Zero protection against anyone with DevTools | MVP only — clearly logged as incomplete |
| Upload files through API route | Familiar pattern from Cloudinary | Breaks on files >4.5 MB; silent failures on Vercel | Never on Vercel free tier |
| Middleware-only auth guards | Clean, centralized | Complete bypass via header spoofing (CVE-2025-29927) | Never — always add server-side check |
| Flat array grid state (no coordinates) | Simple initial model | Collision detection impossible for variable-size blocks | Only for uniform-size-only grids |
| No undo history cap | Trivial implementation | Memory exhaustion in long sessions | Never in production |
| Dashboard-configured R2 CORS | Looks done quickly | Doesn't apply to S3 API endpoint; uploads silently fail | Never — always use Wrangler CLI |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Cloudflare R2 (S3 SDK) | Using `NEXT_PUBLIC_` prefix on R2 secret key | Secret key must never be a public env var; only the presigned URL generation is server-side |
| Cloudflare R2 CORS | Configuring via Cloudflare dashboard | Use Wrangler CLI: `wrangler r2 bucket cors put` with explicit JSON schema |
| R2 presigned URLs | Not setting `x-amz-content-sha256: UNSIGNED-PAYLOAD` header | R2 requires this header for presigned PUT; omitting causes 403 |
| Auth.js credentials provider | Not hashing the password in the `authorize` callback | bcrypt comparison must happen in `authorize`; plain comparison exposes password timing attacks |
| Auth.js + TOTP | Returning `session` from `authorize` before TOTP is verified | Must return a partial session state (e.g., `twoFactorPending: true`) and gate full session on TOTP step |
| Sharp on Vercel | Installing `sharp` without platform-specific binary | Vercel Linux build requires `sharp` installed with `--platform=linux --arch=x64`; wrong binary causes silent failure |
| Sharp native binaries | Sharp included in a generic API route bundle | Sharp's native addon can bloat the serverless function; isolate image processing to a dedicated route |
| Next.js middleware (CVE-2025-29927) | Auth only in middleware.ts | Pin Next.js ≥15.2.3 and add server-side auth checks in all protected routes |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading full-res images in grid editor preview | Editor feels sluggish on older iMac; browser tab consumes 2GB RAM with 50 photos | Use thumbnail variants (max 400px) in editor previews; only serve full-res in lightbox | First session with >20 high-res uploads |
| Sharp image processing on every request | Serverless function cold starts cause 5–10s first-load delays; function timeouts on large files | Process on upload, store derivatives; never process on serve | First user after 5min idle (cold start) |
| Zustand store subscriptions on every grid cell | Editor re-renders all blocks on any state change | Use Zustand `subscribeWithSelector` or split stores to prevent cascade re-renders | Grids with >30 blocks |
| Framer Motion layout animations on large grids | Janky 10fps animation during drag on older iMac | Disable `layoutId` transitions during active drag; restore on drop | Grids with >15 animated items on older hardware |
| R2 ListObjects for photo library | Library view slow because ListObjects is O(n) per page load | Store photo metadata in PostgreSQL; use R2 only for blob storage, never for listing | Photo library with >100 images |
| dnd-kit re-measuring DOM on every drag event | Lag on drag start when grid has many cells | Call `measureDroppableContainers` only on mount and layout change, not continuously | Grids with >20 droppable zones |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Public R2 bucket for photos | Any URL leaked or guessed serves full-resolution images forever | Private bucket only; all access via signed URLs with short TTL (1 hour for lightbox, 24 hours for thumbnails) |
| TOTP secret in plaintext DB column | Full 2FA compromise on any DB read access | AES-256-GCM encrypt before insert; store IV alongside; decrypt only in `authorize` callback |
| No rate limit on TOTP verify endpoint | 6-digit code brute-forceable in ~16 minutes at 1000 req/s | Rate limit to 5 attempts per minute per IP; lock account for 15 minutes after 10 failures |
| Watermark as CSS overlay only | `document.querySelector('img').src` in DevTools instantly reveals full-res URL | Burn watermark into image file server-side via Sharp on upload; CSS overlay is supplementary |
| Session cookie without `httpOnly` + `secure` + `sameSite: strict` | Session hijacking via XSS or CSRF | Auth.js defaults set these correctly — do not override them |
| R2 API credentials in client-side code | Credentials exposed in browser source; attacker gets full write/delete access to bucket | All R2 operations must go through server-side API routes or Cloudflare Workers; `NEXT_PUBLIC_` prefix forbidden for R2 secrets |
| Signing images with a long-lived shared secret | Leaked URL is valid forever | Use short-TTL presigned URLs (1–24 hours); re-sign on each page load for authenticated views |
| Middleware auth bypass not blocked at edge | CVE-2025-29927 exploitable via direct HTTP requests that bypass Cloudflare | Add Cloudflare WAF rule to block requests containing `x-middleware-subrequest` header |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No unsaved-changes warning on editor navigation | Photographer loses a full layout by accidentally clicking a sidebar link | Track `isDirty` in Zustand store; show a confirmation dialog before navigating away from unsaved editor state |
| Upload progress not shown | Photographer clicks upload, sees nothing, clicks again — duplicate uploads | Show per-file progress bar using XHR `upload.onprogress`; disable the upload button during active upload |
| Editor blocks too small to drag on older iMac (lower DPI) | Drag handles are unclickable; frustrating editing experience | Minimum 44px touch target for all drag handles; test explicitly on 1280x1024 resolution |
| Lightbox keyboard nav not announced to screen readers | Accessibility violation; tab navigation breaks | Add `aria-label` to nav buttons, `role="dialog"` to lightbox, `aria-live` region for current photo index |
| Grid preview in editor doesn't match public site render | Photographer builds a layout that looks wrong in production | Editor preview must use the exact same CSS grid renderer as the public site — shared component, not a separate implementation |
| EXIF display shows raw values (e.g., "262144/1000" for shutter speed) | Data looks broken; photographer loses trust in the tool | Format EXIF values on read: convert rational fractions to "1/250s", ISO to "ISO 3200", focal length to "50mm" |

---

## "Looks Done But Isn't" Checklist

- [ ] **Content protection:** Right-click disabled and overlay present — verify that the R2 bucket is actually private and that full-res URLs are not in the page source
- [ ] **2FA enabled:** TOTP enrollment flow works in dev — verify the secret is encrypted in the database row (not plaintext), and that bypassing the TOTP step by manipulating session state is impossible
- [ ] **R2 uploads working:** File uploads succeed in local dev — verify presigned URL flow works on Vercel (different env), CORS is configured for the production domain, and files >10 MB succeed
- [ ] **Image protection:** Watermark visible on photos — verify it is burned into the stored file, not just a CSS overlay, by downloading the raw image from R2 and confirming the watermark is present
- [ ] **Grid editor saved:** Layout saves without errors — verify the saved layout renders identically on the public site (editor preview parity)
- [ ] **Auth migration complete:** Editor is accessible after login — verify that direct API route access without a session cookie returns 401, not 200 (server-side check present, not just middleware)
- [ ] **Sharp processing:** Thumbnails generate correctly in dev — verify Sharp binary is the Linux build on Vercel, not the macOS build from the developer's machine
- [ ] **Undo/redo:** Undo reverts last action — verify history does not include intermediate drag positions; test that 100 rapid actions don't exhaust memory

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Middleware auth bypass discovered in production | HIGH | Immediately add server-side `auth()` checks to all editor routes; block `x-middleware-subrequest` at Cloudflare; rotate all session secrets |
| Plaintext TOTP secrets discovered | HIGH | Generate new TOTP secrets for all users (just one user here); re-enroll authenticator app; apply encryption retroactively; audit DB access logs |
| Full-res images publicly accessible via R2 | MEDIUM | Switch bucket to private; regenerate all public URLs to presigned; audit Cloudflare access logs for unauthorized downloads |
| Grid state corruption (block overlap) | MEDIUM | Add occupancy matrix validation to the save endpoint that rejects invalid layouts; provide "reset to last saved" option in editor |
| Vercel upload failures due to 4.5MB limit | MEDIUM | Switch to presigned URL flow; existing uploads in Cloudinary remain accessible during migration |
| Sharp binary mismatch on Vercel | LOW | Add `optionalDependencies` with platform-specific Sharp package in `package.json`; redeploy |
| CORS misconfiguration blocking uploads | LOW | Reconfigure via Wrangler CLI; test with curl preflight; redeploy |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Middleware-only auth (CVE-2025-29927) | Auth Migration | Direct API route access without cookie returns 401 |
| Plaintext TOTP secrets | Auth Migration | DB column contains ciphertext, not base32 string |
| Upload through Vercel serverless (4.5MB limit) | R2 Migration / Photo Management | Upload a 30MB file; confirm it reaches R2 without error |
| R2 CORS misconfiguration | R2 Migration | Browser-based presigned PUT succeeds from production domain |
| dnd-kit variable-size collision | Grid Editor | Drag a 2x3 block next to a 1x1 block; verify no overlap in saved state |
| CSS-only content protection (false security) | Content Protection | Download raw image from R2 URL; confirm watermark is present in file |
| Unbounded undo/redo history | Grid Editor | 200 rapid block moves; memory usage stays stable |
| Upload progress / duplicate uploads (UX) | Photo Management | Upload 5 files simultaneously; confirm deduplication and progress indicators |
| Unsaved-changes navigation loss (UX) | Grid Editor | Navigate away with unsaved changes; confirm dialog appears |
| Editor/public site render mismatch | Grid Editor | Build a layout in editor; verify public site renders identically |
| R2 ListObjects for photo library | Photo Management | Photo library backed by PostgreSQL metadata; R2 never queried for listing |
| Full-res images served publicly | Content Protection + R2 Migration | `page source` search for `.r2.dev` URLs yields no direct image links |

---

## Sources

- CVE-2025-29927 Next.js middleware auth bypass: [ProjectDiscovery Analysis](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass), [Datadog Security Labs](https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/), [Akamai Detection](https://www.akamai.com/blog/security-research/march-authorization-bypass-critical-nextjs-detections-mitigations)
- dnd-kit variable size collision issues: [GitHub Issue #720](https://github.com/clauderic/dnd-kit/issues/720), [GitHub Issue #813](https://github.com/clauderic/dnd-kit/issues/813), [GitHub Discussion #1605](https://github.com/clauderic/dnd-kit/discussions/1605), [dnd-kit Collision Detection Docs](https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms)
- Cloudflare R2 CORS: [R2 CORS Official Docs](https://developers.cloudflare.com/r2/buckets/cors/), [R2 Presigned URLs Docs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [Community CORS Issue Thread](https://community.cloudflare.com/t/cors-issue-with-r2-presigned-url/428567)
- Vercel 4.5MB limit: [Vercel KB: Bypass Body Size Limit](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions), [Vercel Functions Limits](https://vercel.com/docs/functions/limitations)
- TOTP secret storage: [2FA Best Practices (DEV)](https://dev.to/wesleyisr4/how-to-create-two-factor-authentication-2fa-and-best-practices-4mjl), [Next.js TOTP Implementation](https://lev.engineer/blog/implementing-2fa-in-your-next-js-app-with-google-authenticator)
- Image protection limitations: [Image Protection Article](https://www.naturefocused.com/articles/image-protection.html), [Web Copyright Checker](https://webcopyrightchecker.com/blog/image-scraping-protection-prevention)
- Auth.js migration: [Migrating to v5](https://authjs.dev/getting-started/migrating-to-v5), [NextAuth to Better Auth comparison](https://dev.to/pipipi-dev/nextauthjs-to-better-auth-why-i-switched-auth-libraries-31h3)

---

*Pitfalls research for: Photography portfolio with block grid editor, Cloudflare R2, self-hosted 2FA auth, content protection*
*Researched: 2026-03-10*
