# Security & Code Audit Report — Secure File Management System

**Date:** 2026-06-29
**Branch reviewed:** `feature/security-audit-fixes`
**Scope:** Spring Boot backend + React (Vite) frontend

Severity scale: **Critical** (exploitable, high impact) · **High** · **Medium** · **Low** · **Info** (hardening / quality).

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High     | 3 |
| Medium   | 6 |
| Low      | 5 |
| Info     | 4 |

The core authorization model is solid: a single `FileAccessService.authorize()` gates every file read path, HLS endpoints block path traversal, admin endpoints use granular `@PreAuthorize` authorities, and uploads are content-validated with Tika. The weaknesses are concentrated at the **authentication perimeter** (no rate limiting / lockout, account enumeration), a few **stored-content** gaps, and **production configuration** defaults.

---

## High

### H-1 · No rate limiting or lockout on login, forgot-password, or OTP reset
**Files:** `AuthService.loginUser`, `forgotPassword`, `resetPassword`; no filter/bucket anywhere (grep found none).
- `loginUser` can be called unlimited times → password brute force / credential stuffing.
- `resetPassword` validates a **6-digit OTP** (`findByEmailAndOtp`) with no attempt counter; the OTP stays valid for its full 5-minute window and is only cleared on success/expiry. The 10⁶ keyspace is brute-forceable with enough concurrency, and the account is known (email).

**Fix:** Add per-IP + per-account rate limiting (e.g. Bucket4j / Spring filter) on `/api/auth/**`; invalidate the OTP after N failed attempts; consider temporary lockout after repeated login failures.

### H-2 · User account enumeration via forgot-password
**File:** `AuthService.forgotPassword:157`
```java
User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ResourceNotFoundException("User not found")); // → 404
```
Login correctly returns a generic *"Invalid email or password"*, but forgot-password returns **404 "User not found"** for unknown emails vs. *"OTP sent"* for known ones — letting an attacker enumerate registered accounts.

**Fix:** Always return a generic *"If that email exists, an OTP has been sent."* regardless of whether the user exists.

### H-3 · Stored XSS via Markdown link URLs (`javascript:` scheme)
**Files:** `MarkdownService` (`escapeHtml(true)` only) → rendered in `FilePreviewDialog.jsx:453` via `dangerouslySetInnerHTML`.
`escapeHtml(true)` blocks raw `<script>` inline HTML, but commonmark-java does **not** sanitize link/image URL schemes by default (`sanitizeUrls` is off). A stored `.md`/`.txt` containing `[click me](javascript:fetch('/api/...',{headers:{Authorization:...}}))` renders a live `javascript:` anchor in another user's browser when they preview a shared file — and the JWT lives in `localStorage` (see M-4), so it is stealable.

**Fix:** Enable `HtmlRenderer.builder().sanitizeUrls(true)` (and/or run the rendered HTML through an allowlist sanitizer such as OWASP Java HTML Sanitizer). The `containsSuspiciousContent` scanner does **not** catch `javascript:` inside a markdown link target reliably.

---

## Medium

### M-1 · `spring.jpa.hibernate.ddl-auto=update` in the shipped config
**File:** `application.properties:7`. Letting Hibernate mutate the production schema at startup risks accidental data/column changes and unreviewed migrations. **Fix:** use `validate` (or `none`) in production and manage schema with Flyway/Liquibase.

### M-2 · `spring.jpa.show-sql=true` + `format_sql=true`
**File:** `application.properties:8-9`. Logs every SQL statement (and bound context) — noisy and a minor info-leak in production logs. **Fix:** disable outside local dev.

### M-3 · CORS default list ships localhost + a fixed Vercel origin with `allowCredentials=true`
**Files:** `CorsConfig.java:49`, `application.properties:17`. Functionally fine *if* `CORS_ALLOWED_ORIGINS` is always overridden per environment, but the **baked-in default** mixes dev origins with a prod origin and credentials are allowed. A deployment that forgets to override would accept credentialed requests from `localhost`. **Fix:** make the property required in prod (no localhost in the default), fail fast if unset.

### M-4 · JWT stored in `localStorage`
**File:** `utils/auth.js`. `localStorage` tokens are readable by any XSS (amplifies H-3). There is also **no logout/revocation** server-side — a leaked 24h token is valid until expiry. **Fix:** prefer httpOnly+SameSite cookies, or at minimum shorten expiry, add refresh/rotation, and a server-side revocation list for logout.

### M-5 · No password strength policy; possible NPE on blank reset password
**File:** `AuthService.registerUser` / `resetPassword:206`. Registration accepts any non-blank password (no length/complexity). `resetPassword` never null/blank-checks `newPassword` before `passwordEncoder.encode(newPassword)` — a null body field throws and surfaces as a generic 500. **Fix:** enforce a minimum policy with Bean Validation (`@Valid` on the DTOs) and validate `newPassword` explicitly.

### M-6 · Admin file read paths skip the soft-delete / existence-hiding rule
**File:** `FileContentService.adminDownloadFile` / `adminPreviewFile`. Unlike the user path, these don't check `deleted`. Lower impact (caller already holds `FILE:VIEW_ANY`), but admin preview/download will happily serve soft-deleted files, which may be unexpected. **Fix:** decide intentionally whether admins should see recycled files and document it.

---

## Low

### L-1 · `updateUserRole` audit log records `oldRole` as the literal `"UNKNOWN"`
**File:** `AdminController.java:344`. `oldRole` is initialized to `"UNKNOWN"` and never populated, so every role-change audit entry reads `UNKNOWN -> NEWROLE`, weakening the audit trail. **Fix:** look up and record the user's actual current role before deleting it.

### L-2 · `updateUserStatus` / `updateUserRole` can act on the calling admin
No guard prevents an admin from blocking or demoting **their own** account (or the last remaining admin), which can lock out administration. **Fix:** reject self-status/role changes and protect the last admin.

### L-3 · `EmailService` swallows the original mail exception
**File:** `EmailService.java:47`. `catch (MailException) → throw new RuntimeException("Failed to send OTP email")` drops the cause, hurting diagnostics. **Fix:** chain the cause (`new RuntimeException(msg, exception)`) and log it.

### L-4 · `BCryptPasswordEncoder` instantiated directly instead of injecting the bean
**File:** `AuthService.java:52` does `new BCryptPasswordEncoder()` even though `SecurityConfig` exposes a `@Bean`. Works, but bypasses central config (e.g. strength factor). **Fix:** inject the bean.

### L-5 · Upload limit is 1 GB with no per-user quota / storage cap
**File:** `application.properties:21-22` + files stored as BLOBs in MySQL (`fileEntity.setFileData(...)`). A user can fill the DB; large BLOB columns also strain `max_allowed_packet` and memory (whole file is read into a `byte[]`). **Fix:** add per-user storage quotas and consider object storage for large media.

---

## Info / Hardening

- **I-1 · No security response headers** (CSP, HSTS, X-Frame-Options). A CSP would also blunt H-3. Add a header filter.
- **I-2 · Whole-file in-memory processing.** Upload/download/decompress read the entire file into `byte[]` and temp files; fine for small text, costly for 1 GB video. Consider streaming.
- **I-3 · `.claude/worktrees/` copies are in the working tree** (they surfaced duplicate `FilePreviewDialog.jsx` hits during the audit). Confirm they're gitignored and not shipped.
- **I-4 · Tests are minimal** — only `FilemanagementApplicationTests`. Add tests around `FileAccessService.authorize` and the auth flows, since those are the security-critical paths.

---

## What's already done well (no action needed)

- Centralized object-level authz in `FileAccessService.authorize()` — owner / public / shared, with soft-deleted files returned as 404 to avoid existence disclosure.
- HLS playlist/segment endpoints normalize paths and verify `startsWith(baseDir)` before filesystem access — path traversal blocked, and authz runs before any I/O.
- Upload validation checks the **real** MIME via Tika, not just the extension (blocks an `.mp4`-renamed executable).
- Login returns a generic credential error (no enumeration on that path).
- OTP uses `SecureRandom`, is bound to `email AND otp` together (a code can't reset a different account), and expires.
- `GlobalExceptionHandler` logs-but-doesn't-leak unexpected errors (generic 500).
- Stateless JWT, CSRF disabled appropriately for a token API, BCrypt password hashing, secrets sourced from env vars (no committed credentials found).
