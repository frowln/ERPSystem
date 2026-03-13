package com.privod.platform.modules.crm.domain;

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

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_activities", indexes = {
        @Index(name = "idx_crm_activity_org", columnList = "organization_id"),
        @Index(name = "idx_crm_activity_org_lead", columnList = "organization_id, lead_id"),
        @Index(name = "idx_crm_activity_lead", columnList = "lead_id"),
        @Index(name = "idx_crm_activity_user", columnList = "user_id"),
        @Index(name = "idx_crm_activity_type", columnList = "activity_type"),
        @Index(name = "idx_crm_activity_scheduled", columnList = "scheduled_at"),
        @Index(name = "idx_crm_activity_completed", columnList = "completed_at")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrmActivity extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "lead_id", nullable = false)
    private UUID leadId;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false, length = 20)
    private CrmActivityType activityType;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "summary", length = 500)
    private String summary;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "result", length = 500)
    private String result;

    public boolean isCompleted() {
        return completedAt != null;
    }

    public boolean isOverdue() {
        return scheduledAt != null && completedAt == null && LocalDateTime.now().isAfter(scheduledAt);
    }
}
