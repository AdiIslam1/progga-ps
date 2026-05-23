# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run prisma:seed  # Seed the database

npx prisma migrate dev --name <name>   # Create & apply a migration
npx prisma studio                       # Browse DB in browser
npx prisma generate                     # Regenerate Prisma client after schema changes
```

Start the database (PostgreSQL via Docker):
```bash
docker compose up -d
```

## Environment Setup

Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` — PostgreSQL connection string (default port 5433 via Docker Compose)
- `NEXTAUTH_SECRET` — long random string for JWT signing
- `NEXTAUTH_URL` — base URL (e.g. `http://localhost:3000`)

Optionally set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` for image uploads.

## Architecture

**Next.js 14 App Router** with PostgreSQL via Prisma, NextAuth (JWT), and TailwindCSS.

### Route Structure

```
src/app/
├── [[...sign-in]]/          # Public login page (root "/")
├── api/auth/[...nextauth]/  # NextAuth handler
└── (dashboard)/             # All authenticated pages
    ├── admin/               # Admin dashboard
    ├── teacher/             # Teacher dashboard
    ├── student/             # Student dashboard
    ├── parent/              # Parent dashboard
    ├── list/                # CRUD list pages (students, teachers, etc.)
    ├── exams/
    ├── fees/
    ├── notices/
    ├── report-cards/
    └── routine/
```

### Authentication & Authorization

- **Provider**: NextAuth `CredentialsProvider` with bcryptjs password verification
- **Session**: JWT strategy — role is embedded in the token
- **Roles**: `admin`, `teacher`, `student`, `parent` — checked in `src/lib/roles.ts`
- **Login**: checks Admin → Teacher → Student → Parent tables in order
- Route protection is handled in `src/lib/auth-server.ts` (server-side session helpers)

### Data Layer

- **ORM**: Prisma with schema at `prisma/schema.prisma`
- **Singleton**: `src/lib/prisma.ts` exports the shared `PrismaClient` instance
- **Server Actions**: most mutations live in `src/lib/actions.ts`; fee-specific mutations in `src/lib/feeActions.ts`
- **Validation**: Zod schemas in `src/lib/formValidationSchemas.ts`, shared between server actions and forms

### Forms

Form components in `src/components/forms/` use React Hook Form + Zod resolver. They receive a `type` prop (`"create"` | `"update"`) and an optional `data` prop for pre-population. Submission calls the corresponding server action.

### Key Domain Models

- **Academic**: Grade → Class → Subject → Lesson → Exam/ExamSchedule
- **People**: Admin, Teacher, Student, Parent (each has a separate credentials table)
- **Attendance**: per Lesson, per Student
- **Fees**: FeePackage → FeeCollection (with `FeeStatus`: PAID/UNPAID/PENDING; double-billing prevention is enforced in `feeActions.ts`)
- **Communication**: Notice (SMS/EMAIL/SYSTEM), Announcement, SmsConfig
- **Reports**: Result, ReportCard

### Path Alias

`@/*` resolves to `src/*` — use it for all internal imports.
