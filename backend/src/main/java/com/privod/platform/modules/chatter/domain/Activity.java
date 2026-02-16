package com.privod.platform.modules.chatter.domain;

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

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "chatter_activities", indexes = {
        @Index(name = "idx_activity_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_activity_assigned", columnList = "assigned_to_id"),
        @Index(name = "idx_activity_status", columnList = "status"),
        @Index(name = "idx_activity_due_date", columnList = "due_date"),
        @Index(name = "idx_activity_type", columnList = "activity_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Activity extends BaseEntity {

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false, length = 30)
    private ChatterActivityType activityType;

    @Column(name = "summary", nullable = false, length = 500)
    private String summary;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "assigned_to_id", nullable = false)
    private UUID assignedToId;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ActivityStatus status = ActivityStatus.PLANNED;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "completed_by_id")
    private UUID completedById;

    public void markDone(UUID completedByUserId) {
        this.status = ActivityStatus.DONE;
        this.completedAt = Instant.now();
        this.completedById = completedByUserId;
    }

    public void cancel() {
        this.status = ActivityStatus.CANCELLED;
    }

    public boolean isOverdue() {
        return (status == ActivityStatus.PLANNED || status == ActivityStatus.IN_PROGRESS)
                && dueDate.isBefore(LocalDate.now());
    }
}
