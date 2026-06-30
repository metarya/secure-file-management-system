# Secure File Management System — Project Report

**Prepared by:** Metarya Jain
**Date:** 2026-06-29
**Repository branch:** `feature/security-audit-fixes`
**Type:** Full-stack web application (internship project)

---

## 1. Executive Summary

The Secure File Management System (SFMS) is a full-stack web application that lets
users **upload, store, preview, share, and manage files** through a browser, with a
dedicated **administrator console** for user, file, and access governance. It is built
on an enterprise-grade stack — **Spring Boot 3.5 (Java 17)** on the backend and
**React 19 (Vite)** on the frontend — backed by **MySQL**.

The system's defining characteristic is **security**: every file access is gated by a
centralized authorization service, a fine-grained **Role-Based Access Control (RBAC)**
model governs who can do what, files are validated by **real content type** (not just
file extension) on upload, and authentication uses **stateless JWT** with **BCrypt**
password hashing and **email-OTP** password recovery.

| Metric | Value |
|--------|-------|
| Backend code | ~6,100 lines of Java |
| Frontend code | ~6,100 lines of JS/JSX |
| Backend modules | 7 controllers, 14 services (26 classes incl. sub-packages), 11 repositories, 15 entities, 34 DTOs |
| REST endpoints | ~50 across auth, files, admin, RBAC, and HLS streaming |
| Database | MySQL (JPA/Hibernate) |
| Commits on branch | 15 |

A formal **security audit** has been completed (see `SECURITY_AUDIT_REPORT.md`):
**0 Critical, 3 High, 6 Medium, 5 Low** findings — with the core authorization
architecture rated as solid. Section 7 below summarizes the security posture.

---

## 2. Purpose & Scope

### Problem it solves
Organizations need a controlled place to store and exchange files where **ownership,
visibility, and sharing are explicit and auditable** — instead of unmanaged email
attachments or open shared drives. SFMS provides per-user storage with owner/public/
shared visibility, administrator oversight, and a full audit trail.

### Target users
- **End users** — upload files, organize them, preview in-app, share with specific
  users, manage a recycle bin, and edit text/markdown files.
- **Administrators** — manage user accounts and roles, view system-wide statistics,
  inspect/download any file, reset passwords, and review audit logs.

---

## 3. Technology Stack

### Backend (Spring Boot 3.5.15, Java 17)
| Concern | Technology |
|---------|-----------|
| Web / REST | Spring Web MVC |
| Persistence | Spring Data JPA + Hibernate, MySQL |
| Security | Spring Security, JWT (jjwt 0.13), BCrypt |
| File type detection | Apache Tika 3.3 (real MIME sniffing) |
| Markdown rendering | commonmark-java 0.22 (+ GFM tables) |
| PDF processing | Apache PDFBox 3.0 |
| Video / HLS streaming | Jaffree (FFmpeg wrapper) 2024.08 |
| Email (OTP) | Spring Mail over Brevo SMTP relay |
| Boilerplate reduction | Lombok |

### Frontend (React 19 + Vite 8)
| Concern | Technology |
|---------|-----------|
| UI framework | React 19, React Router 7 |
| Component library | Material UI (MUI) 9 + Emotion |
| HTTP client | Axios (centralized `apiClient`) |
| Video playback | hls.js (adaptive HLS streaming) |
| Rich text / markdown | Turndown + turndown-plugin-gfm |
| HTML sanitization | DOMPurify |
| Tooling | Vite, ESLint |

**Deployment:** Frontend is configured for Vercel; backend connects to MySQL via
environment-driven configuration. Secrets (DB password, JWT secret, mail credentials)
are sourced from **environment variables**, not committed to the repository.

---

## 4. System Architecture

```
┌─────────────────────────────┐         ┌──────────────────────────────────────┐
│   React 19 SPA (Vite)        │  HTTPS  │   Spring Boot 3.5 REST API           │
│                              │ ──────► │                                      │
│  • Auth pages (login/        │  JWT in │  ┌────────────────────────────────┐  │
│    register/forgot)          │  Bearer │  │ JwtAuthFilter (per request)    │  │
│  • User dashboard / files /  │  header │  └──────────────┬─────────────────┘  │
│    recycle bin / shared      │         │                 ▼                    │
│  • Admin console             │ ◄────── │  ┌────────────────────────────────┐  │
│  • apiClient (Axios)         │  JSON   │  │ Controllers (Auth/File/Admin/  │  │
└─────────────────────────────┘         │  │ RBAC/HLS)                      │  │
                                        │  └──────────────┬─────────────────┘  │
                                        │                 ▼                    │
                                        │  ┌────────────────────────────────┐  │
                                        │  │ Services                       │  │
                                        │  │  • FileAccessService.authorize │  │
                                        │  │    (central object-level authz)│  │
                                        │  │  • RbacService (@PreAuthorize) │  │
                                        │  │  • FileValidationService (Tika)│  │
                                        │  │  • Auth/Email/Audit/Streaming  │  │
                                        │  └──────────────┬─────────────────┘  │
                                        │                 ▼                    │
                                        │  ┌────────────────────────────────┐  │
                                        │  │ JPA Repositories ──► MySQL      │  │
                                        │  └────────────────────────────────┘  │
                                        └──────────────────────────────────────┘
```

### Request lifecycle
1. The SPA sends requests with a **JWT** in the `Authorization: Bearer` header.
2. `JwtAuthFilter` validates the token on every request and populates the security
   context (the API is **stateless** — no server sessions).
3. Controllers delegate to services. Method-level `@PreAuthorize` checks enforce
   **RBAC authorities** (e.g. `FILE:VIEW_ANY`, `USER:MANAGE`).
4. For any individual file, `FileAccessService.authorize()` is the **single gate** that
   decides owner / public / shared access before content is read.
5. Repositories persist to MySQL; sensitive actions are written to an **audit log**.

---

## 5. Core Features

### 5.1 Authentication & Account Management
- **Registration / login** with BCrypt-hashed passwords and JWT issuance.
- **Forgot/reset password** via a time-limited **6-digit OTP** emailed to the user
  (generated with `SecureRandom`, bound to email + OTP together, expires after a window).
- Stateless JWT (24-hour expiry) — no server-side session state to scale.

### 5.2 File Management
- **Upload** with real content-type validation via Apache Tika (a `.mp4`-renamed
  executable is rejected because the actual bytes are inspected).
- **My Files**, **search**, **rename**, **description editing**, and **in-place content
  editing** for text/markdown files.
- **Recycle bin** — soft delete, restore, and permanent delete. Soft-deleted files are
  returned as 404 to outside users to avoid disclosing their existence.
- **Visibility control** — private (owner-only), public, or shared.

### 5.3 Preview & Streaming
- **In-app preview** for text, markdown (rendered server-side with commonmark), PDFs,
  images, audio, and video.
- **Adaptive video streaming** via **HLS** — the backend generates `.m3u8` playlists and
  `.ts` segments (FFmpeg/Jaffree), and the frontend plays them with hls.js. Path
  traversal is blocked on segment/playlist endpoints.

### 5.4 Sharing
- Share a file with **specific users** by granting fine-grained `FilePermission`s.
- **Shared-with-me** view; recipients can remove a shared entry; owners can revoke.

### 5.5 Administration Console
- **Dashboard** with system statistics, storage usage, and recent uploads.
- **User management** — list users, change roles, block/activate accounts, delete users,
  and admin-initiated password resets.
- **File management** — list/preview/download/stream/delete *any* file, view file stats
  and per-user summaries.
- **Audit logs** and **system health** views.

### 5.6 Access Control (RBAC)
- A relational RBAC model: **Users ↔ Roles ↔ Permissions**, with both
  **role-derived** and **direct user** permission grants
  (`UserRoleEntity`, `RolePermissionEntity`, `UserPermissionEntity`).
- Enforced declaratively with Spring Security `@PreAuthorize` using granular authorities
  rather than coarse "is admin" checks — so privileges can be tuned per action.

---

## 6. Data Model (Key Entities)

| Entity | Responsibility |
|--------|----------------|
| `User` | Account, credentials (hashed), status, OTP fields |
| `FileEntity` | File metadata + stored bytes, owner, visibility, soft-delete flag |
| `Folder` | Folder organization |
| `FilePermission` | Per-file share grants to specific users |
| `RoleEntity` / `PermissionEntity` / `PermissionType` | RBAC vocabulary |
| `UserRoleEntity` / `RolePermissionEntity` / `UserPermissionEntity` | RBAC join tables (role assignments, role→permission, direct user→permission) |
| `AuditLog` | Record of security-sensitive admin/user actions |
| `UserStatus` | Account lifecycle state (active / blocked) |

---

## 7. Security Posture

A dedicated security audit (`SECURITY_AUDIT_REPORT.md`) was completed on this branch.

### What is already strong (no action needed)
- **Centralized object-level authorization** — one `FileAccessService.authorize()`
  gates every file read path (owner / public / shared), with soft-deleted files hidden
  as 404 to prevent existence disclosure.
- **Path-traversal protection** on HLS playlist/segment endpoints (normalized paths +
  `startsWith(baseDir)` check; authorization runs *before* any file I/O).
- **Real MIME validation** with Tika on upload.
- **Login does not leak account existence** (generic "invalid email or password").
- **OTP** uses `SecureRandom`, is bound to email *and* code together, and expires.
- **Stateless JWT**, CSRF appropriately disabled for a token API, BCrypt hashing, and
  **no secrets committed** — all sourced from environment variables.

### Findings summary
| Severity | Count | Examples |
|----------|-------|----------|
| Critical | 0 | — |
| High | 3 | No login/OTP rate-limiting; account enumeration on forgot-password; stored XSS via markdown `javascript:` links |
| Medium | 6 | JWT in `localStorage`; `ddl-auto=update` in shipped config; CORS default mixing dev+prod origins; no password strength policy |
| Low | 5 | Audit log records `oldRole` as `UNKNOWN`; admin can demote/block self; mail exception cause swallowed |
| Info | 4 | No CSP/HSTS headers; whole-file in-memory processing; minimal tests |

### Recommended next steps (prioritized)
1. **Add rate limiting / lockout** on `/api/auth/**` (login, forgot-password, OTP) and
   invalidate the OTP after N failed attempts. *(High)*
2. **Make forgot-password responses generic** to stop account enumeration. *(High)*
3. **Enable markdown URL sanitization** (`sanitizeUrls(true)` / OWASP sanitizer) to close
   the stored-XSS vector. *(High)*
4. **Harden production config** — `ddl-auto=validate`, disable SQL logging, require an
   explicit CORS origin list, add CSP/HSTS security headers. *(Medium)*
5. **Strengthen auth** — password strength policy, JWT revocation/logout, and consider
   httpOnly cookies. *(Medium)*
6. **Add tests** around `FileAccessService.authorize()` and the auth flows — the
   security-critical paths. *(Info)*

---

## 8. Engineering Highlights

- **Separation of concerns** — thin controllers, business logic in 16 focused services,
  and 34 DTOs that keep entities out of the API surface (14 core services, plus
  `compression` and `streaming` sub-packages).
- **Defense-in-depth authorization** — declarative `@PreAuthorize` (RBAC) *plus* a single
  programmatic object-level gate, so no file endpoint can accidentally skip the check.
- **Content integrity** — Tika MIME sniffing and a `FileHashService` for file hashing.
- **Streaming done right** — large media served as adaptive HLS rather than a single blob,
  with traversal protection.
- **Operability** — audit logging, system-health endpoints, and a global exception handler
  that logs internally but returns generic errors (no stack-trace leakage).

---

## 9. Known Limitations & Future Work

- **Storage model** — files are stored as BLOBs in MySQL with whole-file in-memory
  processing; migrating large media to object storage (e.g. S3) and streaming I/O would
  improve scalability. *No per-user storage quota yet.*
- **Auth perimeter hardening** — rate limiting, lockout, and token revocation are the top
  outstanding security items.
- **Test coverage** — currently minimal; the security-critical paths should be covered
  first.
- **Schema management** — adopt Flyway/Liquibase migrations instead of Hibernate
  `ddl-auto` for production.

---

## 10. Conclusion

The Secure File Management System is a **functionally complete, security-conscious
full-stack application** that demonstrates real-world patterns: layered architecture,
RBAC, centralized authorization, content validation, OTP-based recovery, adaptive media
streaming, and audit logging. A formal security audit found **no critical issues** and a
clear, prioritized backlog of hardening work. The codebase is well-structured and
positioned for the next iteration — primarily **authentication-perimeter hardening,
production configuration, and test coverage**.

---

### Appendix A — Repository Layout
```
secure-file-management-system/
├── backend/                       Spring Boot API
│   └── src/main/java/com/project/filemanagement/
│       ├── config/                Security & CORS configuration
│       ├── controller/            7 REST controllers (~50 endpoints)
│       ├── service/               14 services + compression/streaming sub-packages
│       ├── repository/            11 JPA repositories
│       ├── entity/                15 JPA entities (incl. RBAC join tables)
│       ├── dto/                   34 request/response DTOs
│       ├── security/              JwtAuthFilter, JwtUtil, authn services
│       └── exception/             Global exception handling
├── frontend/                      React 19 + Vite SPA
│   └── src/
│       ├── api/                   API wrappers (auth, file, admin, rbac)
│       ├── components/            files / share / upload / ui components
│       ├── pages/                 auth / user / admin pages
│       ├── routes/                Protected & admin route guards
│       ├── lib/apiClient.js       Centralized Axios client
│       └── utils/                 Auth/token helpers
├── SECURITY_AUDIT_REPORT.md       Full security audit (companion document)
└── PROJECT_REPORT.md              This report
```

### Appendix B — Companion Documents
- `SECURITY_AUDIT_REPORT.md` — detailed, file-referenced security findings and fixes.
