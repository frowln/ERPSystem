package com.privod.platform.modules.compliance.domain;

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
import java.util.UUID;

/**
 * Запрос субъекта персональных данных (ст. 14, 20, 21 152-ФЗ).
 * Срок исполнения — 30 дней с момента создания.
 */
@Entity
@Table(name = "data_subject_requests", indexes = {
        @Index(name = "idx_dsr_org", columnList = "organization_id"),
        @Index(name = "idx_dsr_user", columnList = "user_id"),
        @Index(name = "idx_dsr_status", columnList = "status"),
        @Index(name = "idx_dsr_deadline", columnList = "deadline_at")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataSubjectRequest extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 30)
    private SubjectRequestType requestType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SubjectRequestStatus status = SubjectRequestStatus.PENDING;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "response_text", columnDefinition = "TEXT")
    private String responseText;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "deadline_at", nullable = false)
    private Instant deadlineAt;

    @Column(name = "processed_by")
    private UUID processedBy;
}
