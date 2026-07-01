# Secure File Management System

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-brightgreen?logo=springboot)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)
![License](https://img.shields.io/badge/License-MIT-yellow)

A modern, secure file management platform built with **Spring Boot** and **React**. It provides JWT-based authentication, role-based access control, file versioning, sharing, activity logging, multimedia support, pluggable storage providers (Local, Google Drive, OneDrive, Amazon S3, SFTP), and a full administration dashboard.

---

## Features

### Authentication & Security

| Feature | Description |
|---|---|
| JWT Authentication | Stateless token-based auth with configurable expiry |
| Email OTP Verification | One-time password sent via email for password reset |
| Password Reset | Secure OTP-gated reset flow |
| Account Locking | Admin can disable accounts; blocked users receive a clear error |
| Session Expiry Detection | Frontend detects expired tokens and redirects to login |
| Secure Password Hashing | BCrypt via Spring Security Crypto |
| Role-Based Access Control | `ADMIN` / `USER` roles with granular per-user permission overrides |
| SFTP Host Key Verification | Known-hosts checked at connection time via JSch/Apache SSHD |
| Encryption Key Management | Storage credentials encrypted at rest using AES (configurable key + salt) |

### File Management

- Upload files (up to 1 GB per file)
- Download files
- Preview files in-browser
- Rename files
- Soft delete with restore (recycle bin)
- Version history with diff viewer
- File sharing with per-user permission controls
- Rich text / Markdown editing with live preview
- Native text storage (text content stored in the database)
- Full-text search
- Public / private visibility controls

### Multimedia

| Type | Support |
|---|---|
| Images | Inline preview |
| PDF | Embedded viewer via PDFBox |
| Video | HLS adaptive streaming (FFmpeg-backed) |
| Audio | Streaming playback |
| Compression | Per-type compression pipeline (video, audio, PDF, text) |

### Storage Providers

Each user can configure their own storage backend independently. Credentials are encrypted before being stored.

| Provider | Notes |
|---|---|
| **Local** | Files stored on the server filesystem |
| **Google Drive** | OAuth token-based cloud storage |
| **OneDrive** | Microsoft Graph API integration |
| **Amazon S3** | AWS SDK-backed object storage |
| **SFTP** | SSH file transfer with host-key verification |

The storage layer uses a pluggable `StorageProvider` interface, making it straightforward to add new backends.

### Administration

- User management (list, update role, update status, reset password)
- File management (view, preview, delete any user's files)
- Activity logs (per-user action history)
- Audit logs (security-relevant events)
- Storage usage statistics per user
- System health statistics
- Server-side pagination and sorting on all admin tables

### Developer Features

- **Flyway** – versioned database migrations (`V1` through `V6`)
- **JUnit 5 + Mockito** – unit and integration tests
- **REST API** – JSON over HTTP, structured error responses
- **Modular services** – single-responsibility service classes
- **Clean layered architecture** – Controller → Service → Repository
- **Maven** – build and dependency management
- **Vite** – fast frontend build tooling

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Java 21, Spring Boot 3.5, Spring Security, JJWT 0.13 |
| **Frontend** | React 19, Vite 8, React Router 7, Axios |
| **Database** | MySQL 8, Flyway migrations, Spring Data JPA |
| **Storage** | Local FS, Google Drive, OneDrive, Amazon S3, SFTP |
| **Security** | BCrypt, AES encryption, JWT, Spring Security |
| **Multimedia** | Apache Tika, PDFBox, FFmpeg (Jaffree), Apache SSHD |
| **Testing** | JUnit 5, Mockito, Spring Boot Test |

---

## Architecture

```
Frontend (React + Vite)
        ↓  HTTP / JSON
REST API (Spring Boot – port 8080)
        ↓
Controllers  (/api/auth, /api/files, /api/admin, ...)
        ↓
Services  (AuthService, FileService, FileSharingService, ...)
        ↓
Repositories  (Spring Data JPA)
        ↓
MySQL Database  +  Storage Providers (Local / Drive / S3 / SFTP)
```

The backend follows a strict layered architecture. Controllers handle request validation and HTTP concerns only. Services own all business logic. Repositories are thin JPA interfaces. The `StorageProvider` abstraction decouples file I/O from the rest of the system.

---

## Project Structure

```
secure-file-management-system/
├── backend/
│   ├── src/main/java/com/project/filemanagement/
│   │   ├── controller/        # REST controllers
│   │   ├── service/           # Business logic (incl. compression/, streaming/)
│   │   ├── storage/           # StorageProvider interface + implementations
│   │   ├── entity/            # JPA entities
│   │   ├── repository/        # Spring Data JPA repositories
│   │   ├── dto/               # Request / response DTOs
│   │   ├── security/          # JWT filter, JwtUtil, AuthenticatedUserService
│   │   ├── config/            # CORS, Security configuration
│   │   └── exception/         # Global exception handler
│   └── src/main/resources/
│       ├── application.properties
│       └── db/migration/      # Flyway SQL scripts (V1–V6)
└── frontend/
    └── src/
        ├── pages/             # admin/, auth/, user/
        ├── components/        # Reusable UI components
        ├── api/               # Axios API clients
        ├── hooks/             # Custom React hooks
        └── routes/            # React Router configuration
```

---

## Screenshots

> Screenshots will be added in a future update.

| Screen | Path |
|---|---|
| Login | `docs/images/login.png` |
| Dashboard | `docs/images/dashboard.png` |
| File Manager | `docs/images/file-manager.png` |
| File Preview | `docs/images/file-preview.png` |
| Admin Panel | `docs/images/admin-panel.png` |
| Storage Settings | `docs/images/storage-settings.png` |

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Java JDK | 21+ |
| Maven | 3.9+ |
| Node.js | 18+ |
| MySQL | 8.0+ |
| FFmpeg | Any recent release (required for video/audio features) |

### Clone

```bash
git clone https://github.com/metarya07/secure-file-management-system.git
cd secure-file-management-system
```

### Database Setup

```sql
CREATE DATABASE file_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sfms_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON file_management_db.* TO 'sfms_user'@'localhost';
FLUSH PRIVILEGES;
```

Flyway will run all migrations automatically on first startup.

### Backend Setup

Copy the example below into `backend/src/main/resources/application-local.properties` (or export as environment variables) and fill in your values:

```properties
DB_URL=jdbc:mysql://127.0.0.1:3306/file_management_db
DB_USERNAME=sfms_user
DB_PASSWORD=your_db_password

JWT_SECRET=your-256-bit-secret-here

MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your_smtp_password
MAIL_FROM=noreply@yourdomain.com

APP_STORAGE_ENCRYPTION_KEY=change-this-in-production
APP_STORAGE_ENCRYPTION_SALT=change-this-salt

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Run Backend

```bash
cd backend
mvn spring-boot:run
```

The API starts on `http://localhost:8080`.

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080
```

### Run Frontend

```bash
npm run dev
```

The app starts on `http://localhost:5173`.

---

## Environment Variables

| Variable | Required | Description | Example |
|---|---|---|---|
| `DB_URL` | Yes | JDBC connection string | `jdbc:mysql://127.0.0.1:3306/file_management_db` |
| `DB_USERNAME` | Yes | MySQL username | `sfms_user` |
| `DB_PASSWORD` | Yes | MySQL password | *(secret)* |
| `JWT_SECRET` | Yes | HS256 signing key (≥ 32 chars) | *(secret)* |
| `MAIL_USERNAME` | Yes | SMTP username (Brevo / Gmail / etc.) | `user@example.com` |
| `MAIL_PASSWORD` | Yes | SMTP password or API key | *(secret)* |
| `MAIL_FROM` | Yes | Sender address for outgoing emails | `noreply@yourdomain.com` |
| `APP_STORAGE_ENCRYPTION_KEY` | Yes | AES key for credential encryption | *(secret, ≥ 16 chars)* |
| `APP_STORAGE_ENCRYPTION_SALT` | No | Encryption salt | `5c0744940b5c369b` |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated allowed origins | `http://localhost:5173` |

---

## Database

Schema management is handled entirely by **Flyway**. Migration scripts live in `backend/src/main/resources/db/migration/` and run automatically at startup.

| Migration | Description |
|---|---|
| `V1__Initial_Schema.sql` | Core tables: users, files, roles, permissions |
| `V2__add_index_files_file_hash.sql` | Index on file hash for deduplication checks |
| `V3__add_activity_logs.sql` | Activity log table |
| `V4__add_file_versions.sql` | File versioning table |
| `V5__add_storage_providers.sql` | Per-user storage settings table |
| `V6__add_sftp_storage.sql` | SFTP-specific columns |

`spring.jpa.hibernate.ddl-auto=validate` ensures Hibernate only validates entity mappings against the Flyway-managed schema — it never issues `ALTER TABLE` statements.

---

## Storage Providers

Users can switch their storage backend at any time from the **Storage Settings** page. Credentials are encrypted with AES before being persisted.

| Provider | Required credentials |
|---|---|
| **Local** | None (uses server filesystem) |
| **Google Drive** | OAuth access token + refresh token |
| **OneDrive** | OAuth access token + refresh token |
| **Amazon S3** | Access key, secret key, bucket name, region |
| **SFTP** | Host, port, username, password or private key, known-hosts entry |

The `StorageProvider` interface in `storage/StorageProvider.java` defines the contract. All providers are registered in `StorageProviderRegistry` and resolved at runtime via `StorageContext`.

---

## Security Features

| Feature | Implementation |
|---|---|
| JWT Authentication | Stateless tokens validated on every request via `JwtAuthFilter` |
| Account Locking | Admins can disable user accounts; `UserStatus.DISABLED` blocks login |
| Password Reset | Six-digit OTP emailed to user; expires after use |
| Secure Password Hashing | BCrypt via `spring-security-crypto` |
| Session Expiry Redirect | Frontend intercepts 401 responses and redirects to the login page |
| Credential Encryption | Storage provider credentials encrypted with AES-256 at rest (`CredentialEncryptionService`) |
| SFTP Host Key Verification | Known-host entry verified via JSch / Apache SSHD before connection is established |
| Role-Based Access Control | Roles (`ADMIN`, `USER`) with fine-grained per-user permission overrides managed via `RbacService` |
| Audit Logging | Security-sensitive actions recorded in a dedicated `audit_logs` table |

---

## Testing

```bash
cd backend
mvn test
```

Tests are written with **JUnit 5** and **Mockito**. Notable test classes:

| Test | Covers |
|---|---|
| `StorageActivityLoggingTest` | Activity log entries generated for storage operations |
| `SftpStorageProviderTest` | SFTP provider connection and file transfer logic |

To run a single test class:

```bash
mvn test -Dtest=SftpStorageProviderTest
```

---

## Roadmap

- [ ] Two-factor authentication (TOTP)
- [ ] Folder hierarchy with nested folders
- [ ] Real-time notifications (WebSocket)
- [ ] Shareable download links with expiry
- [ ] Storage quota enforcement per user
- [ ] Docker Compose setup for one-command local start

---

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes with a descriptive message.
4. Open a pull request against `main` and describe what your change does.

Please keep pull requests focused — one feature or fix per PR. For significant changes, open an issue first to discuss the approach.

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
