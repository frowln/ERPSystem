package com.privod.platform.modules.messaging.domain;

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
@Table(name = "mail_activities", indexes = {
        @Index(name = "idx_mail_activity_record", columnList = "model_name, record_id"),
        @Index(name = "idx_mail_activity_type", columnList = "activity_type_id"),
        @Index(name = "idx_mail_activity_user", columnList = "user_id"),
        @Index(name = "idx_mail_activity_assigned", columnList = "assigned_user_id"),
        @Index(name = "idx_mail_activity_status", columnList = "status"),
        @Index(name = "idx_mail_activity_due_date", columnList = "due_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MailActivity extends BaseEntity {

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "record_id", nullable = false)
    private UUID recordId;

    @Column(name = "activity_type_id", nullable = false)
    private UUID activityTypeId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "assigned_user_id", nullable = false)
    private UUID assignedUserId;

    @Column(name = "summary", length = 500)
    private String summary;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MailActivityStatus status = MailActivityStatus.PLANNED;

    @Column(name = "completed_at")
    private Instant completedAt;

    public void markDone() {
        this.status = MailActivityStatus.DONE;
        this.completedAt = Instant.now();
    }

    public void cancel() {
        this.status = MailActivityStatus.CANCELLED;
    }

    public boolean isOverdue() {
        return status == MailActivityStatus.PLANNED
                && dueDate.isBefore(LocalDate.now());
    }
}
