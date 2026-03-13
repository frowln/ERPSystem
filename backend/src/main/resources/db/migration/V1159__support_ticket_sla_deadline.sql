-- V1152: P2-CRM-3 — SLA deadline и статус для тикетов поддержки.
-- sla_deadline_at = createdAt + TicketCategory.slaHours при создании тикета.
-- sla_status: ON_TRACK / AT_RISK / BREACHED (обновляется SupportSlaCheckJob каждые 30 мин).

ALTER TABLE support_tickets
    ADD COLUMN IF NOT EXISTS sla_deadline_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sla_status       VARCHAR(20) NOT NULL DEFAULT 'ON_TRACK';

CREATE INDEX IF NOT EXISTS idx_support_ticket_sla_status
    ON support_tickets (sla_status)
    WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_support_ticket_sla_deadline
    ON support_tickets (sla_deadline_at)
    WHERE deleted = FALSE AND status NOT IN ('RESOLVED', 'CLOSED');
