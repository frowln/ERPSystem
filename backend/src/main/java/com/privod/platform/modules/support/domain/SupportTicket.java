package com.privod.platform.modules.support.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "support_tickets", indexes = {
        @Index(name = "idx_support_ticket_org", columnList = "organization_id"),
        @Index(name = "idx_support_ticket_org_status", columnList = "organization_id, status"),
        @Index(name = "idx_support_ticket_status", columnList = "status"),
        @Index(name = "idx_support_ticket_priority", columnList = "priority"),
        @Index(name = "idx_support_ticket_reporter", columnList = "reporter_id"),
        @Index(name = "idx_support_ticket_assignee", columnList = "assignee_id"),
        @Index(name = "idx_support_ticket_code", columnList = "code", unique = true)
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicket extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "code", unique = true, length = 50)
    private String code;

    @Column(name = "subject", nullable = false, length = 500)
    private String subject;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "category", length = 100)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    @Column(name = "reporter_id")
    private UUID reporterId;

    @Column(name = "assignee_id")
    private UUID assigneeId;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "satisfaction_rating")
    private Integer satisfactionRating;

    // P2-CRM-3: SLA deadline from TicketCategory.slaHours
    @Column(name = "sla_deadline_at")
    private Instant slaDeadlineAt;

    @Column(name = "sla_status", length = 20)
    @Builder.Default
    private String slaStatus = "ON_TRACK";
}
