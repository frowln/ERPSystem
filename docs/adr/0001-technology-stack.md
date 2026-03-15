# ADR-0001: Technology Stack Selection

## Status: Accepted

## Context
PRIVOD is a construction ERP/CRM platform targeting Russian construction companies.
We needed a modern, full-stack technology that supports:
- Complex form-heavy UI with many modules
- Real-time collaboration (WebSocket)
- Russian regulatory compliance (152-FZ)
- PWA for construction site workers
- Integration with 1C, SBIS, and Russian government systems

## Decision
- **Frontend**: React 19 + TypeScript 5.7 + Vite 6
- **Backend**: Java 21 + Spring Boot 3.4 + PostgreSQL
- **State**: Zustand 5 (client) + TanStack React Query (server)
- **Styling**: Tailwind CSS with dark mode
- **Auth**: JWT + Spring Security
- **Cache**: Redis
- **Storage**: MinIO (S3-compatible)
- **i18n**: Custom solution with type-safe keys (ru.ts primary + en.ts)

## Consequences
- Java gives us strong typing and mature ecosystem for enterprise
- React gives us huge component ecosystem and developer availability
- PostgreSQL handles complex queries and JSONB well
- Need Flyway for migrations (currently 300+ migrations)
- MinIO allows self-hosted S3 for data residency compliance
