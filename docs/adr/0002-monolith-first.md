# ADR-0002: Monolith-First Architecture

## Status: Accepted

## Context
We need to deliver 85+ modules quickly with a small team. Microservices add operational complexity.

## Decision
Start as a modular monolith with clear module boundaries:
- Backend: `modules/<name>/{domain,repository,service,web}` per module
- Frontend: `modules/<name>/` with isolated pages per module
- No cross-module imports (enforced by convention)
- Shared infrastructure in `infrastructure/` package

## Consequences
- Faster development: one deployment, one database, simple debugging
- Risk: modules can become coupled if discipline slips
- Future: can extract hot modules to microservices later if needed
- Database: single PostgreSQL instance handles current scale
