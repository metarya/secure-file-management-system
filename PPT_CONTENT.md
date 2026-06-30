# Secure File Management System — Presentation Content (for AI PPT Maker)

> **How to use this file:** Paste the whole document into your AI PPT tool
> (Gamma, Tome, Beautiful.ai, Canva Magic, SlidesAI, etc.). Each `## Slide N`
> block is one slide. The **Title** and **Bullets** become the slide; the
> **Speaker notes** are what you say out loud. **Visual hint** tells the AI what
> image/icon/diagram to put on the slide. Suggested design: clean, dark-blue +
> white "security/tech" theme, sans-serif font, one accent color (teal or green).
>
> Total: 15 slides (~12–15 min talk).

---

## Slide 1 — Title

**Title:** Secure File Management System
**Subtitle:** A Security-First Full-Stack File Storage & Sharing Platform

**Bullets:**
- Built with Spring Boot 3.5 (Java 17) + React 19
- Presented by: Metarya Jain
- Internship Project · 2026

**Speaker notes:** "Good morning. Today I'll walk you through the Secure File
Management System I built — a full-stack web app for storing, sharing, and
managing files where security and access control are the core design principle,
not an afterthought."

**Visual hint:** A shield + folder/lock icon over a subtle network background.

---

## Slide 2 — The Problem

**Title:** Why This Project?

**Bullets:**
- Teams share files over email and open drives — no control over who sees what
- Ownership, visibility, and sharing are usually invisible and unauditable
- Renamed malicious files (e.g. a virus disguised as a video) slip through
- No record of who accessed or changed a file

**Speaker notes:** "Most file sharing today is messy and risky. You email
attachments or drop files in a shared drive with no idea who can open them, no
audit trail, and no protection against disguised malicious files. This project
solves that with explicit ownership, controlled sharing, and full auditing."

**Visual hint:** Split image — chaotic email attachments on the left, an
organized secure vault on the right.

---

## Slide 3 — Solution Overview

**Title:** What We Built

**Bullets:**
- Upload, preview, share, and manage files from the browser
- Per-user storage with private / public / shared visibility
- Fine-grained Role-Based Access Control (RBAC)
- Admin console for users, files, and audit oversight
- In-app preview for text, markdown, PDF, images, audio & video

**Speaker notes:** "The system gives every user their own secure storage. Files
can be private, public, or shared with specific people. Admins get a full
control panel. And everything is governed by role-based permissions and an audit
log."

**Visual hint:** A clean product screenshot mockup or 3-panel dashboard graphic.

---

## Slide 4 — Technology Stack

**Title:** Technology Stack

**Bullets:**
- **Backend:** Spring Boot 3.5, Java 17, Spring Security, JPA/Hibernate, MySQL
- **Auth:** JWT (stateless) + BCrypt password hashing + Email OTP
- **File safety:** Apache Tika (real content-type detection)
- **Media:** FFmpeg/Jaffree for HLS video streaming, PDFBox, commonmark
- **Frontend:** React 19, Vite, Material UI, Axios, hls.js, DOMPurify

**Speaker notes:** "On the backend it's an enterprise Spring Boot stack with
MySQL. Security uses stateless JWT and BCrypt. Tika inspects the actual file
bytes to detect type. For video we generate adaptive HLS streams. The frontend
is a modern React 19 single-page app with Material UI."

**Visual hint:** A grid of technology logos grouped into Backend / Frontend / Security.

---

## Slide 5 — System Architecture

**Title:** System Architecture

**Bullets:**
- React SPA ⟶ sends JWT in every request
- `JwtAuthFilter` validates the token (no server sessions — fully stateless)
- Controllers ⟶ Services ⟶ JPA Repositories ⟶ MySQL
- Two layers of protection: RBAC `@PreAuthorize` + a central file-access gate

**Speaker notes:** "Here's the flow. The React app sends a JWT with each request.
A filter validates it. Controllers stay thin and hand off to services, which talk
to the database. The key security idea: every request passes through two
independent checks before touching a file."

**Visual hint:** A left-to-right flow diagram:
`Browser → JWT Filter → Controller → Service (authz gate) → Repository → MySQL`.

---

## Slide 6 — Security Architecture (The Core Idea)

**Title:** Defense in Depth — Two Layers of Authorization

**Bullets:**
- **Layer 1 — RBAC:** `@PreAuthorize` checks granular authorities (e.g. `FILE:VIEW_ANY`, `USER:MANAGE`)
- **Layer 2 — Object gate:** one `FileAccessService.authorize()` decides owner / public / shared for *every* file
- A single choke point = no endpoint can accidentally skip the check
- Soft-deleted files return 404 — their existence is never disclosed

**Speaker notes:** "This is the heart of the project. Instead of scattering
'is this user allowed?' checks everywhere, every file access funnels through one
authorization method. That single choke point means it's nearly impossible to
ship an unprotected endpoint. Deleted files even return 404 so attackers can't
tell they ever existed."

**Visual hint:** Two concentric shields around a file icon, labeled "RBAC" (outer)
and "Object-Level Authorization" (inner).

---

## Slide 7 — Authentication & Account Security

**Title:** Authentication & Account Recovery

**Bullets:**
- Stateless JWT tokens (24-hour expiry) — scales without server sessions
- Passwords stored with BCrypt (never in plain text)
- Forgot-password via time-limited 6-digit OTP emailed to the user
- OTP generated with `SecureRandom`, bound to email + code, auto-expires
- Login returns a generic error — no leaking which emails are registered

**Speaker notes:** "Authentication uses JWT, so the server stays stateless and
scalable. Passwords are BCrypt-hashed. Password recovery sends a secure one-time
code by email that expires quickly. And we're careful not to reveal whether an
email exists during login."

**Visual hint:** A login screen with a lock, plus an email/OTP icon flow.

---

## Slide 8 — Core Feature: File Management

**Title:** File Management

**Bullets:**
- Upload with real content-type validation (blocks disguised files)
- My Files, search, rename, edit descriptions, and edit text/markdown in-place
- Recycle bin: soft delete → restore or permanently delete
- Visibility toggle: private · public · shared

**Speaker notes:** "Users upload files that are validated by their actual content,
not just the extension — so a virus renamed to '.mp4' is rejected. They can
search, rename, edit text files in the browser, and there's a recycle bin so
nothing is lost by accident."

**Visual hint:** A file dashboard mockup with upload button, file cards, and a
recycle-bin tab.

---

## Slide 9 — Core Feature: Preview & Streaming

**Title:** In-App Preview & Adaptive Video Streaming

**Bullets:**
- Preview text, markdown, PDF, images, audio, and video without downloading
- Markdown rendered safely on the server (commonmark)
- Video served as adaptive HLS — smooth playback at any connection speed
- Streaming endpoints block path-traversal attacks

**Speaker notes:** "Users can preview almost any file type right in the browser.
For video, instead of forcing a huge download, the backend chops it into adaptive
HLS segments so it streams smoothly — the same technique YouTube and Netflix use.
And those endpoints are hardened against path-traversal attacks."

**Visual hint:** A video player UI with a quality/buffering bar, beside a PDF/image
preview thumbnail.

---

## Slide 10 — Core Feature: Sharing & Collaboration

**Title:** Secure File Sharing

**Bullets:**
- Share a file with specific users — not the whole world
- "Shared with me" view for recipients
- Owners can revoke access; recipients can remove entries
- Every share is a tracked, fine-grained permission

**Speaker notes:** "Sharing is precise — you pick exactly who gets a file. They
see it in a 'Shared with me' view. Owners can revoke at any time. Every share is
an explicit permission record, so access is always intentional and traceable."

**Visual hint:** Two user avatars connected by a file with a permission badge.

---

## Slide 11 — Admin Console

**Title:** Administrator Control Panel

**Bullets:**
- Dashboard: system stats, storage usage, recent uploads
- User management: roles, block/activate, delete, password resets
- File oversight: preview / download / stream / delete any file
- Audit logs and system-health monitoring

**Speaker notes:** "Admins get a full governance console — they can manage users
and roles, oversee all files, reset passwords, and review an audit log of
sensitive actions. This is what makes the system enterprise-ready."

**Visual hint:** An admin dashboard mockup with charts, a user table, and stat cards.

---

## Slide 12 — Role-Based Access Control (RBAC)

**Title:** Fine-Grained Access Control

**Bullets:**
- Relational model: Users ↔ Roles ↔ Permissions
- Permissions granted via roles *and* directly to users
- Granular authorities (per action) instead of one big "admin" flag
- Enforced declaratively with Spring Security `@PreAuthorize`

**Speaker notes:** "Rather than a blunt 'admin vs. user' switch, the system uses
true RBAC. Permissions can come from a user's role or be granted directly. This
means privileges can be tuned for each action — a real enterprise access model."

**Visual hint:** A diagram: Users → Roles → Permissions with arrows, plus a direct
User → Permission link.

---

## Slide 13 — Security Audit Results

**Title:** Security Audit — Honest & Measured

**Bullets:**
- Formal audit completed: **0 Critical**, 3 High, 6 Medium, 5 Low findings
- Strengths: central authorization, path-traversal protection, real MIME checks, no committed secrets
- Open items: rate-limiting on login/OTP, markdown link sanitization, production config hardening
- Findings are **identified and prioritized** for the next iteration

**Speaker notes:** "I also ran a formal security audit on the project. The good
news: zero critical issues, and the core authorization design was rated solid.
There are open hardening items — like adding login rate-limiting — which I've
documented and prioritized. Presenting both the strengths and the gaps is part of
building secure software responsibly."

**Visual hint:** A severity bar chart: Critical 0, High 3, Medium 6, Low 5 — green
to red gradient.

---

## Slide 14 — Roadmap & Future Work

**Title:** What's Next

**Bullets:**
- Auth hardening: rate-limiting, account lockout, token revocation/logout
- Production config: schema migrations (Flyway), security headers (CSP/HSTS)
- Scalability: move large media to object storage + streaming I/O, per-user quotas
- Quality: automated tests around the security-critical paths

**Speaker notes:** "Looking ahead, the priorities are hardening the authentication
perimeter, tightening production configuration, scaling the storage layer for
large media, and adding automated tests around the security-critical code."

**Visual hint:** A simple roadmap timeline with 4 milestones.

---

## Slide 15 — Summary & Thank You

**Title:** Summary

**Bullets:**
- A complete, security-first full-stack file platform
- Enterprise patterns: RBAC, central authorization, content validation, audit logging
- ~12,000 lines of code across Spring Boot + React 19
- Zero critical security findings, with a clear improvement roadmap

**Speaker notes:** "To wrap up: this is a complete, security-conscious full-stack
application built on real enterprise patterns. It's functional, audited, and has
a clear path forward. Thank you — I'm happy to take any questions."

**Visual hint:** Clean closing slide with the project logo/shield and "Thank You ·
Questions?" plus contact line.

---

## Bonus — One-Paragraph Description (if the AI tool asks for a project summary)

> The Secure File Management System is a full-stack web application for uploading,
> previewing, sharing, and managing files, built with Spring Boot 3.5 (Java 17) and
> React 19 over MySQL. Its defining feature is a security-first architecture:
> every file access passes through a centralized authorization gate plus
> fine-grained Role-Based Access Control, authentication uses stateless JWT with
> BCrypt and email-OTP recovery, and uploads are validated by real content type
> with Apache Tika. It includes adaptive HLS video streaming, in-app previews,
> precise user-to-user sharing, a recycle bin, an administrator console, and full
> audit logging. A formal security audit found zero critical issues.

## Bonus — Suggested Design Settings for the AI Tool

- **Theme:** Modern, professional, tech/security
- **Color palette:** Deep navy / dark slate background, white text, one accent (teal or green)
- **Font:** Clean sans-serif (Inter, Roboto, or Montserrat)
- **Imagery:** Line icons, shields, locks, flow diagrams — avoid clip-art
- **Tone:** Confident, technical but clear
