# ADR-0003: Russian Data Residency (152-FZ Compliance)

## Status: Accepted

## Context
Federal Law 152-FZ requires personal data of Russian citizens to be stored on servers physically located in Russia.

## Decision
- All data storage (PostgreSQL, Redis, MinIO) is self-hosted on Russian servers
- LLM integration switched from OpenAI to GigaChat (Sber) -- data stays in Russia
- No external CDN for user data; static assets only
- PII fields encrypted with AES-256-GCM (EncryptedFieldConverter)
- Data consent tracked in `data_consents` table with legal basis

## Consequences
- Cannot use AWS/GCP managed services (using Synology NAS or Russian cloud providers)
- Must maintain own infrastructure (backup, monitoring, updates)
- GigaChat quality may be lower than GPT-4 for some tasks
- Compliance proof available for Roskomnadzor audits
