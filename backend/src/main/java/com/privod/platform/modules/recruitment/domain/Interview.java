package com.privod.platform.modules.recruitment.domain;

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

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "interviews", indexes = {
        @Index(name = "idx_interview_applicant", columnList = "applicant_id"),
        @Index(name = "idx_interview_interviewer", columnList = "interviewer_id"),
        @Index(name = "idx_interview_scheduled_at", columnList = "scheduled_at"),
        @Index(name = "idx_interview_result", columnList = "result")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Interview extends BaseEntity {

    @Column(name = "applicant_id", nullable = false)
    private UUID applicantId;

    @Column(name = "interviewer_id")
    private UUID interviewerId;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "duration", nullable = false)
    @Builder.Default
    private int duration = 60;

    @Column(name = "location", length = 500)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", length = 20)
    private InterviewResult result;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
