# Project Health Report — Secure File Management System

**Date:** 2026-07-01
**Branch:** `feature/sftp-storage-provider`
**Stack:** Spring Boot 3.5 (Java 17) · React 18 + Vite · MySQL
**Size:** ~10.3k LOC backend · ~7.1k LOC frontend · 3 test files

This is a consolidated health report across **six dimensions**: Security, Architecture, Code Quality, Performance, Testing, and Configuration/Ops. It supersedes and extends the earlier security-only audit (`SECURITY_AUDIT_REPORT.md`) with the new storage-provider feature now on this branch.

---

## Scorecard

| Dimension | Grade | One-line assessment |
|-----------|:-----:|---------------------|
| Security | B− | Strong authz core; perimeter (rate limiting, enumeration) and new-feature gaps (host-key, default enc key) let it down |
| Architecture | B+ | Clean layering, single-responsibility services, pluggable storage-provider pattern |
| Code Quality | B | Readable and well-commented; inconsistent formatting/indent, some copy-paste across services |
| Performance | C+ | Whole-file in-memory + DB-BLOB storage won't scale to the 1 GB limit it advertises |
| Testing | C− | 3 test files for ~17k LOC; critical auth/authz paths untested |
| Config / Ops | C+ | Secrets via env (good) but schema-manager conflict + prod-unsafe defaults |

---

## 1. Security

### High
- **S-1 · No rate limiting / lockout** on `/api/auth/**` — login brute force and 6-digit OTP brute force (no attempt counter, 5-min window). *(see prior report H-1)*
- **S-2 · Account enumeration** — `forgotPassword` returns 404 for unknown emails vs. success for known. *(H-2)*
- **S-3 · Stored XSS via Markdown link URLs** — `MarkdownService` uses `escapeHtml(true)` but not `sanitizeUrls(true)`; `[x](javascript:...)` renders a live anchor in another user's preview (`FilePreviewDialog.jsx:453`). JWT in `localStorage` makes it stealable. *(H-3)*
- **S-4 · SFTP disables host-key verification** — `SftpStorageProvider.java:183` sets `StrictHostKeyChecking=no`, accepting any server key → man-in-the-middle can intercept credentials and file bytes. **Fix:** support a `known_hosts` file / pinned host key; don't default to `no`.
- **S-5 · Hardcoded default credential-encryption key** — `CredentialEncryptionService` defaults `app.storage.encryption-key` to `"dev-storage-encryption-key-change-me"` and a fixed salt, both committed. If production doesn't override, all stored cloud/SFTP secrets are encrypted with a public key ≈ plaintext at rest. **Fix:** fail fast (no default) when the key is unset in a non-dev profile.

### Medium
- **S-6 · JWT in `localStorage`, no server-side logout/revocation** (24h validity). *(M-4)*
- **S-7 · No password strength policy**; `resetPassword` can NPE on a null new password. *(M-5)*
- **S-8 · SSRF-ish surface via user-supplied SFTP host** — a user can point the provider at internal hosts (`127.0.0.1`, `169.254.169.254`). Lower risk (their own config, SFTP not HTTP) but worth an allowlist/egress control if multi-tenant.
- **S-9 · CORS default bakes in localhost + a prod origin with `allowCredentials=true`** — safe only if always overridden per env. *(M-3)*

### Good (already handled)
Centralized `FileAccessService.authorize()` for every read path · HLS path-traversal guards · Tika content-based upload validation · generic login error · `SecureRandom` OTP bound to email+OTP · non-leaking `GlobalExceptionHandler` · **storage secrets encrypted at rest with AES + random IV (`Encryptors.delux`), never returned in DTOs** · BCrypt hashing · secrets sourced from env vars.

---

## 2. Architecture & Design — **B+**

**Strengths**
- Clear layering: controller → service → repository, with DTOs at the boundary (no entity leakage in responses).
- Single-responsibility decomposition: `FileService` delegates to focused collaborators (`FileContentService`, `FileStreamingService`, `FileSharingService`, `FileValidationService`, `FileHashService`, `MarkdownService`).
- **Authorization defined once** (`FileAccessService`) and reused — the single most valuable structural decision here.
- **Pluggable storage** via `StorageProvider` interface + `StorageProviderRegistry` + `StorageContext` — the new SFTP provider slots in cleanly (open/closed principle). Per-user provider config with transient decryption is a tidy design.
- Compression uses a strategy pattern (`CompressorFactory` / `FileCompressor`).

**Weaknesses**
- `AdminController` mixes repository access, business logic (stats aggregation), and audit logging directly in the controller — several endpoints iterate `findAll()` and compute in-controller. Push into a service.
- `FileService` is still a large orchestrator (~790 lines) with owner/editor permission checks duplicated inline across `updateFileContent`, `renameFile`, `updateFileDescription` (see Q-1).

---

## 3. Code Quality — **B**

- **Q-1 · Duplicated owner/editor permission check** — the same `isOwner || isEditor` block is copy-pasted in `updateFileContent`, `renameFile`, `updateFileDescription`. Extract a helper (or fold into `FileAccessService` as a write-check).
- **Q-2 · Inconsistent formatting** — several files mix indentation levels (e.g. `AuthService.registerUser` lines 86–104 drop to column 0; `AdminController` methods vary). Run a formatter (Spotless / google-java-format) in CI.
- **Q-3 · Stale audit data** — `AdminController.updateUserRole` logs `oldRole` as the literal `"UNKNOWN"` (never populated). *(prior L-1)*
- **Q-4 · Swallowed exceptions** — `EmailService` drops the `MailException` cause; several `catch (IOException ignored) {}` blocks hide cleanup failures. *(L-3)*
- **Q-5 · `testConnection` dead branch** — `UserStorageSettingsService:275-277` computes `testDesc` with identical values in both branches of the ternary.
- **Q-6 · `new BCryptPasswordEncoder()` in `AuthService`** instead of injecting the configured bean. *(L-4)*
- **Positive:** comments are genuinely explanatory (the *why*, not the *what*), and naming is consistent and descriptive.

---

## 4. Performance & Scalability — **C+**

- **P-1 · Files stored as MySQL BLOBs and read fully into `byte[]`** — upload, download, and decompress all materialize the entire file in memory (`file.getBytes()`, `Files.readAllBytes`, `setFileData(byte[])`). With a **1 GB** advertised upload limit this is an OOM / heap-pressure risk under concurrency, and bloats the DB + `max_allowed_packet`. **Fix:** stream to object storage (the new provider abstraction is the right foundation) and stream responses.
- **P-2 · `findAll()` + in-memory aggregation** in admin stats/health/summary endpoints — loads every user and file row to count/sum. Won't scale; replace with aggregate queries (`COUNT`, `SUM`, `GROUP BY`).
- **P-3 · Per-request SFTP connect/disconnect** — `withChannel` opens a fresh session per operation. Fine for occasional use; add pooling if it becomes a hot path.
- **P-4 · `getPrimaryRole` per user in a stream** triggers a query per row (N+1) in `getAllUsers` / stats. Batch-load roles.

---

## 5. Testing — **C−**

- Only **3 test files** (`FilemanagementApplicationTests`, `SftpStorageProviderTest`, `StorageActivityLoggingTest`) for ~17k LOC. Credit for the new SFTP integration test (embedded MINA sshd) and storage-activity test — good direction.
- **Gaps:** nothing covers `FileAccessService.authorize` (the security keystone), the auth/OTP flows, sharing, or the exception handler. **Fix:** prioritize authorization + auth unit/integration tests; wire coverage into CI.

---

## 6. Configuration & Ops — **C+**

- **C-1 · Schema-manager conflict** — `flyway-core`/`flyway-mysql` are now dependencies (migrations up to `V6__add_sftp_storage.sql`) **while** `spring.jpa.hibernate.ddl-auto=update` is still set. Hibernate and Flyway both mutate the schema → drift and surprises. **Fix:** set `ddl-auto=validate` (or `none`) and let Flyway own the schema.
- **C-2 · `show-sql=true` / `format_sql=true`** in the shipped config — disable outside dev.
- **C-3 · Prod-unsafe defaults** — the credential-encryption key/salt (S-5) and CORS list (S-9) have dev defaults that are dangerous if not overridden. Prefer fail-fast over silent defaults in a `prod` profile.
- **Positive:** DB/JWT/mail secrets are all env-sourced; no committed credentials found.

---

## Prioritized action list

**Now (security-critical, low effort):**
1. S-4 — enable SFTP host-key verification (remove `StrictHostKeyChecking=no` default).
2. S-5 — remove the hardcoded encryption key default; fail fast in prod.
3. S-3 — turn on `sanitizeUrls(true)` in `MarkdownService`.
4. C-1 — set `ddl-auto=validate` now that Flyway owns the schema.

**Next (perimeter hardening):**
5. S-1 / S-2 — add rate limiting + generic forgot-password response.
6. S-6 — move JWT out of `localStorage` (or add revocation + shorter expiry).

**Then (scale & maintainability):**
7. P-1 / P-2 — stream large files via the storage abstraction; replace `findAll()` aggregation with SQL.
8. Testing — cover `FileAccessService` and auth flows; add Spotless + coverage gates in CI.
9. Q-1 — extract the duplicated owner/editor write-permission check.
