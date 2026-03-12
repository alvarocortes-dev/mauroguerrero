---
phase: 01-auth-migration
plan: 04
subsystem: auth
tags: [better-auth, totp, turnstile, qrcode, login-ui, magic-link]

requires:
  - phase: 01-auth-migration (plan 03)
    provides: TOTP enforcement hooks, auth client with twoFactor plugin
provides:
  - Login page with password + magic link tabs + inline TOTP step
  - TOTP setup page with QR code + manual secret + verification
  - Cloudflare Turnstile captcha integration after 3 failed attempts
affects: [01-auth-migration plan 05, 02-portfolio-crud]

tech-stack:
  added: [qrcode.react (QRCodeSVG)]
  patterns: [CSS variable theming with data-theme, Turnstile lazy loading, state machine login form]

key-files:
  created:
    - src/app/(editor)/login/page.tsx
    - src/app/(editor)/editor/setup-totp/page.tsx
    - src/components/auth/LoginForm.tsx
    - src/components/auth/TotpSetup.tsx
  modified:
    - src/lib/auth/config.ts

key-decisions:
  - "Route setup-totp en /editor/setup-totp (dentro de route group editor) en vez de /setup-totp"
  - "Turnstile solo se activa cuando NEXT_PUBLIC_TURNSTILE_SITE_KEY esta configurado (graceful degradation)"
  - "Resend inicializado lazy para evitar crash sin RESEND_API_KEY en desarrollo"
  - "twoFactor.enable({password}) genera URI, verifyTotp({code}) activa — API corregida vs plan"

patterns-established:
  - "Login form state machine: idle | loading | totp_required | magic_link_sent | error"
  - "Auth card design: backdrop-blur-md bg-[var(--foreground)]/5 border rounded-2xl centered on viewport"
  - "Conditional third-party scripts: only load when env var is set"

requirements-completed: [AUTH-02, AUTH-03, AUTH-04]

duration: ~25min
completed: 2026-03-12
---

# Plan 01-04: Login y TOTP Setup UI Summary

**Pagina de login con tabs (password + magic link), step TOTP inline, Turnstile captcha, y pagina de setup TOTP con QR code usando qrcode.react**

## Performance

- **Duration:** ~25 min (across sessions, includes checkpoint pause)
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files created:** 4
- **Files modified:** 1

## Accomplishments

- Login page at /login with two tabs ("Contrasena" and "Enlace magico"), state machine form, and inline TOTP step after successful credentials
- Cloudflare Turnstile captcha appears after 3 failed login attempts (only when site key is configured)
- TOTP setup page at /editor/setup-totp with QR code (QRCodeSVG), manual secret display, and 6-digit verification form
- Visual design consistent with site theme using CSS variables (--background, --foreground, --muted-foreground) and backdrop blur card pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Pagina de login con tabs y step de TOTP** - `49285a2` (feat)
2. **Task 2: Pagina de setup de TOTP (primer login)** - `c1b5367` (feat)
3. **Hotfix: Resend lazy init + Turnstile sin API key** - `c031c2a` (fix)
4. **Task 3: Checkpoint visual** - Approved by user (no commit)

## Files Created/Modified

- `src/app/(editor)/login/page.tsx` - Server component rendering LoginForm at /login
- `src/components/auth/LoginForm.tsx` - Client component with state machine: tabs, password/magic-link, TOTP step, Turnstile
- `src/app/(editor)/editor/setup-totp/page.tsx` - Server component with session check, redirects if TOTP already enabled
- `src/components/auth/TotpSetup.tsx` - Client component with QR code, manual secret, 6-digit verify form
- `src/lib/auth/config.ts` - Modified: Resend lazy initialization to avoid crash without API key

## Decisions Made

- **Route setup-totp ubicado en /editor/setup-totp**: Movido dentro del route group (editor) para que la URL sea /editor/setup-totp, coherente con la proteccion de middleware en /editor/*
- **Turnstile graceful degradation**: Widget solo aparece si NEXT_PUBLIC_TURNSTILE_SITE_KEY esta definido, permitiendo desarrollo local sin Cloudflare
- **Resend lazy init**: La instancia de Resend se crea bajo demanda en vez de al importar el modulo, evitando crash cuando RESEND_API_KEY no esta configurado
- **API de twoFactor corregida**: El plan indicaba getTotpUri + enable, pero la API real es enable({password}) para generar URI y verifyTotp({code}) para activar

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Route setup-totp reubicado**
- **Found during:** Task 2
- **Issue:** Plan indicaba src/app/(editor)/setup-totp/page.tsx pero eso generaria URL /setup-totp, no /editor/setup-totp
- **Fix:** Creado en src/app/(editor)/editor/setup-totp/page.tsx para URL correcta /editor/setup-totp
- **Files modified:** src/app/(editor)/editor/setup-totp/page.tsx
- **Committed in:** c1b5367

**2. [Rule 1 - Bug] API twoFactor corregida**
- **Found during:** Task 2
- **Issue:** Plan usaba getTotpUri({password}) + enable({code}), pero API real es enable({password}) para URI + verifyTotp({code}) para verificar
- **Fix:** Corregidas las llamadas en TotpSetup.tsx
- **Files modified:** src/components/auth/TotpSetup.tsx
- **Committed in:** c1b5367

**3. [Rule 1 - Bug] Resend lazy init**
- **Found during:** Post-Task 2
- **Issue:** Resend se inicializaba al importar config.ts, crasheando sin RESEND_API_KEY
- **Fix:** Inicializacion lazy (crear instancia al primer uso)
- **Files modified:** src/lib/auth/config.ts
- **Committed in:** c031c2a

**4. [Rule 1 - Bug] Turnstile sin API key**
- **Found during:** Post-Task 2
- **Issue:** Turnstile intentaba renderizar sin NEXT_PUBLIC_TURNSTILE_SITE_KEY
- **Fix:** Condicional: solo mostrar widget si la env var existe
- **Files modified:** src/components/auth/LoginForm.tsx
- **Committed in:** c031c2a

---

**Total deviations:** 4 auto-fixed (3 bugs, 1 blocking)
**Impact on plan:** Todas las correcciones fueron necesarias para que el codigo funcione en desarrollo local sin servicios externos configurados. Sin scope creep.

## Issues Encountered

- **/api/auth/sign-in/email retorna 500**: Esperado — la base de datos PostgreSQL (Vercel Postgres) no esta conectada aun. Es un tema de infraestructura, no un bug de codigo. Se resolvera cuando se configure la DB.

## User Setup Required

Plan 01-04 requiere configuracion de Cloudflare Turnstile (descrito en el frontmatter del plan):
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — Cloudflare Dashboard -> Turnstile -> Add Site
- `TURNSTILE_SECRET_KEY` — Cloudflare Dashboard -> Turnstile -> Secret key
- Nota: el login funciona sin estas variables (graceful degradation), pero el captcha no aparecera

## Next Phase Readiness

- Login UI y TOTP setup UI completos — listos para pruebas end-to-end cuando la DB este conectada
- Falta Plan 01-05 (smoke tests / integracion final) para completar Phase 1
- Dependencia critica: Vercel Postgres debe estar configurado antes de pruebas funcionales

## Self-Check: PASSED

- All 5 files verified on disk
- All 3 commits verified in git history (49285a2, c1b5367, c031c2a)

---
*Phase: 01-auth-migration*
*Completed: 2026-03-12*
