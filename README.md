# Secure File Management System (SFMS)

A secure full-stack file management platform built using React, Spring Boot, and MySQL. The system supports file upload, preview, sharing, multimedia compression, recycle bin functionality, backend search, and JWT-protected HLS video streaming.

---

# Features

## Authentication & Security

- JWT Authentication
- Role-Based Access Control
- Secure API Endpoints
- Admin Dashboard
- Audit Logs

## File Management

- Upload Files
- Download Files
- Preview Files
- Rename Files
- Edit Text Files
- File Description Support
- Public/Private Visibility
- Duplicate Detection

## Sharing System

- Share Files with Users
- Permission-Based Access
- Shared With Me
- Remove Shared Access

## Recycle Bin

- Soft Delete Files
- Restore Deleted Files
- Permanent Delete

## Search

- Backend Search
- Case-Insensitive Search
- Debounced Search

## Preview Support

- Images
- PDF Files
- Text Files
- Markdown Files
- Audio Files
- Video Files

## Compression

### Text Compression
- GZIP Compression

### PDF Compression
- Apache PDFBox

### Audio Compression
- FFmpeg

### Video Compression
- H.264 + AAC

## Streaming

### Range Streaming
- Seek Support
- Audio Streaming
- Video Streaming

### HLS Streaming

- Automatic HLS Generation
- master.m3u8 Playlist
- TS Segment Streaming
- JWT-Protected Endpoints
- React hls.js Player

---

# Tech Stack

## Backend

- Java 17
- Spring Boot 3
- Spring Security
- JWT Authentication
- Spring Data JPA
- Maven

## Frontend

- React 19
- Vite
- Material UI
- React Router DOM
- Axios

## Database

- MySQL

## Multimedia Processing

- Apache PDFBox
- Apache Commons Compress
- FFmpeg
- HLS
- hls.js

## Development Tools

- Git
- GitHub
- VS Code
- IntelliJ IDEA
- Postman
- MySQL Workbench

## Deployment

### Frontend
- Vercel

### Backend
- Spring Boot running locally

### Database
- Local MySQL Database

---

# Repository Structure

```text
secure-file-management-system
│
├── backend
│   ├── src
│   │   ├── config
│   │   ├── controller
│   │   ├── dto
│   │   ├── entity
│   │   ├── exception
│   │   ├── repository
│   │   ├── security
│   │   └── service
│   │       ├── compression
│   │       ├── ffmpeg
│   │       └── streaming
│   ├── uploads
│   └── pom.xml
│
├── frontend
│   ├── public
│   ├── src
│   └── package.json
│
├── README.md
└── LICENSE
```

# System Architecture

```text
React Frontend
        ↓
REST APIs
        ↓
Spring Boot Backend
        ↓
Service Layer
        ↓
Repository Layer
        ↓
MySQL Database
```

## Multimedia Pipeline

```text
Upload
   ↓
Compression
   ↓
Database Metadata
   ↓
HLS Generation
   ↓
master.m3u8
   ↓
TS Segments
   ↓
JWT Protected Streaming
   ↓
React hls.js Player
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/metarya/secure-file-management-system.git

cd secure-file-management-system
```

---

# Backend Setup

Go to backend:

```bash
cd backend
```

Configure MySQL credentials in:

```properties
application.properties
```

Build:

```bash
mvn clean install
```

Run:

```bash
mvn spring-boot:run
```

Backend runs on:

```text
http://localhost:8080
```

---

# Frontend Setup

Go to frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run:

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

# FFmpeg Setup

Install FFmpeg and ensure it is available in PATH.

Verify:

```bash
ffmpeg -version
```

FFmpeg is used for:

- Audio Compression
- Video Compression
- HLS Generation

---

# HLS Streaming

The system automatically generates:

```text
master.m3u8
master0.ts
master1.ts
master2.ts
...
```

Streaming endpoints are protected using JWT authentication.

Workflow:

```text
Upload Video
↓
Compression
↓
Generate HLS
↓
Persist Metadata
↓
Spring Boot Endpoints
↓
React hls.js Player
↓
HTML5 Video Playback
```

---

# Future Enhancements

- Adaptive Bitrate Streaming
- Multi-Bitrate HLS
- Video Thumbnail Generation
- Tags and Categories
- Folder Support
- Favorites
- Notifications
- Version History
- AWS S3 Integration
- CDN Support

---

# Author

**Metarya Jain**

B.Tech Computer Science and Engineering

Academic Session: 2023–2027

Project Type:

**Internship Project**

---

# License

This project is intended for educational and internship purposes.
