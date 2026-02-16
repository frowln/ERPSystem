package com.privod.platform.modules.changeManagement.domain;

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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "change_order_requests", indexes = {
        @Index(name = "idx_cor_change_event", columnList = "change_event_id"),
        @Index(name = "idx_cor_project", columnList = "project_id"),
        @Index(name = "idx_cor_status", columnList = "status"),
        @Index(name = "idx_cor_requested_by", columnList = "requested_by_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeOrderRequest extends BaseEntity {

    @Column(name = "change_event_id", nullable = false)
    private UUID changeEventId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "number", length = 50)
    private String number;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ChangeOrderRequestStatus status = ChangeOrderRequestStatus.DRAFT;

    @Column(name = "requested_by_id")
    private UUID requestedById;

    @Column(name = "requested_date")
    private LocalDate requestedDate;

    @Column(name = "proposed_cost", precision = 18, scale = 2)
    private BigDecimal proposedCost;

    @Column(name = "proposed_schedule_change")
    private Integer proposedScheduleChange;

    @Column(name = "justification", columnDefinition = "TEXT")
    private String justification;

    @Column(name = "attachment_ids", columnDefinition = "JSONB")
    private String attachmentIds;

    @Column(name = "reviewed_by_id")
    private UUID reviewedById;

    @Column(name = "reviewed_date")
    private LocalDate reviewedDate;

    @Column(name = "review_comments", columnDefinition = "TEXT")
    private String reviewComments;

    public boolean canTransitionTo(ChangeOrderRequestStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
