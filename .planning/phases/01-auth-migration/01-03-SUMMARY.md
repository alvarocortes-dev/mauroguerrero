---
phase: 01-auth-migration
plan: 03
subsystem: auth
tags: [better-auth, totp, hooks, dev-account, scrypt, timingSafeEqual]

# Dependency graph
requires:
  - phase: 01-auth-migration/02
    provides: "betterAuth() instance with twoFactor, magicLink plugins and Drizzle schema"
provides:
  - "TOTP enforcement hook on /sign-in/email and /sign-in/magic-link paths"
  - "Dev account login route at /api/auth/dev-login with env-var credentials"
  - "Dev user seeding via ensureDevUserExists()"
affects: [01-auth-migration]

# Tech tracking
tech-stack:
  added: []
  patterns: ["createAuthMiddleware from better-auth/api for hooks", "internalAdapter.createSession for programmatic session creation", "timingSafeEqual + scryptSync for constant-time credential validation"]

key-files:
  created:
    - src/lib/auth/dev-account.ts
    - src/app/api/auth/dev-login/route.ts
  modified:
    - src/lib/auth/config.ts
    - tests/auth/totp.test.ts

key-decisions:
  - "hooks.after es un solo AuthMiddleware (no array de matchers) — filtrado de path dentro del middleware"
  - "createAuthMiddleware se importa de better-auth/api (no del modulo principal)"
  - "Session de dev-account creada via internalAdapter.createSession (no hay API publica para crear sesiones)"
  - "Cookie de sesion se establece manualmente con atributos de authCookies.sessionToken"

patterns-established:
  - "Hook after: createAuthMiddleware de better-auth/api con filtrado de ctx.path interno"
  - "Dev account: credenciales en env vars, sesion via internalAdapter, cookie manual"

requirements-completed: [AUTH-03, AUTH-04]

# Metrics
duration: 6min
completed: 2026-03-11
---

# Phase 1 Plan 03: TOTP Enforcement + Dev Account Summary

**Hook after en better-auth forzando TOTP en ambos paths de login; cuenta dev con scrypt+timingSafeEqual y sesion via internalAdapter**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-11T15:07:13Z
- **Completed:** 2026-03-11T15:13:27Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Hook after en config.ts que redirige a /editor/setup-totp si twoFactorEnabled es false
- Ambos paths /sign-in/email y /sign-in/magic-link cubiertos por el mismo hook
- Cuenta dev con validacion segura (timingSafeEqual + scryptSync) y sesion programatica

## Task Commits

Each task was committed atomically:

1. **Task 1: Agregar hook after para forzar TOTP en login** - `8f4bb18` (feat)
2. **Task 1 fix: Corregir import y estructura de hooks** - `a1b7328` (fix)
3. **Task 2: Implementar cuenta dev con credenciales en env vars** - `0454049` (feat)

## Files Created/Modified
- `src/lib/auth/config.ts` - Hook after con createAuthMiddleware para enforcement TOTP
- `src/lib/auth/dev-account.ts` - validateDevCredentials y ensureDevUserExists
- `src/app/api/auth/dev-login/route.ts` - POST endpoint para login dev con cookie de sesion
- `tests/auth/totp.test.ts` - Tests GREEN para logica de enforcement TOTP

## Decisions Made
- createAuthMiddleware viene de `better-auth/api`, no del modulo principal — descubierto durante compilacion TS
- hooks.after acepta un solo AuthMiddleware en vez de array de {matcher, handler} — la API de better-auth v1.5 cambio respecto a documentacion previa
- Sesion del dev account se crea via `ctx.internalAdapter.createSession()` ya que no existe API publica `createSession` — la cookie se establece manualmente con atributos de `authCookies.sessionToken`
- Dev account siempre redirige a /editor/setup-totp (TOTP obligatorio para ambas cuentas segun decision bloqueada)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Import incorrecto de createAuthMiddleware**
- **Found during:** Task 1 (TOTP hook implementation)
- **Issue:** Plan indicaba `import { createAuthMiddleware } from "better-auth"` pero el export real esta en `better-auth/api`
- **Fix:** Cambiado import a `better-auth/api`
- **Files modified:** src/lib/auth/config.ts
- **Verification:** TypeScript compila sin errores
- **Committed in:** a1b7328

**2. [Rule 1 - Bug] Estructura de hooks.after incorrecta**
- **Found during:** Task 1 (TOTP hook implementation)
- **Issue:** Plan usaba array de {matcher, handler} pero la API real acepta un solo AuthMiddleware
- **Fix:** Reestructurado como middleware unico con filtrado de path interno
- **Files modified:** src/lib/auth/config.ts
- **Verification:** TypeScript compila sin errores
- **Committed in:** a1b7328

**3. [Rule 1 - Bug] auth.api.createSession no existe**
- **Found during:** Task 2 (dev-login route)
- **Issue:** Plan usaba `auth.api.createSession()` que no existe en la API publica de better-auth
- **Fix:** Usado `ctx.internalAdapter.createSession()` via `auth.$context` con cookie manual
- **Files modified:** src/app/api/auth/dev-login/route.ts
- **Verification:** TypeScript compila sin errores
- **Committed in:** 0454049

---

**Total deviations:** 3 auto-fixed (3 bugs — APIs de better-auth diferian de documentacion en plan)
**Impact on plan:** Todos los auto-fixes necesarios para compilacion. Sin scope creep.

## Issues Encountered
- La API de better-auth v1.5 difiere significativamente de la documentacion usada en la planificacion para hooks y session creation. Los tres fixes fueron necesarios para que el codigo compile.

## User Setup Required

**Variables de entorno** (en `.env.local`):
- `DEV_EMAIL` - Email del admin dev (diferente al email del fotografo)
- `DEV_PASSWORD_HASH` - Generar con: `node -e "const {scryptSync,randomBytes}=require('crypto');const s=randomBytes(16).toString('hex');console.log(s+':'+scryptSync('TU_PASSWORD',s,64).toString('hex'))"`

## Next Phase Readiness
- TOTP enforcement activo en ambos paths de login
- Dev account login funcional via /api/auth/dev-login
- Listo para Plan 04 (TOTP setup UI y verificacion)

---
*Phase: 01-auth-migration*
*Completed: 2026-03-11*
