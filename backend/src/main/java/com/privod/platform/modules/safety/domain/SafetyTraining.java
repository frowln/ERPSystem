package com.privod.platform.modules.safety.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "safety_trainings", indexes = {
        @Index(name = "idx_st_project", columnList = "project_id"),
        @Index(name = "idx_st_type", columnList = "training_type"),
        @Index(name = "idx_st_status", columnList = "status"),
        @Index(name = "idx_st_date", columnList = "date"),
        @Index(name = "idx_st_instructor", columnList = "instructor_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafetyTraining extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "training_type", nullable = false, length = 20)
    private TrainingType trainingType;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "instructor_id")
    private UUID instructorId;

    @Column(name = "instructor_name", length = 300)
    private String instructorName;

    @Column(name = "participants", columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String participants;

    @Column(name = "topics", columnDefinition = "TEXT")
    private String topics;

    @Column(name = "duration")
    private Integer duration;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TrainingStatus status = TrainingStatus.PLANNED;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "participant_count")
    @Builder.Default
    private Integer participantCount = 0;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "signature_data", columnDefinition = "TEXT")
    private String signatureData;

    @Column(name = "next_scheduled_date")
    private LocalDate nextScheduledDate;
}
