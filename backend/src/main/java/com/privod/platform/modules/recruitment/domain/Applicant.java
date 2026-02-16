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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "applicants", indexes = {
        @Index(name = "idx_applicant_job_position", columnList = "job_position_id"),
        @Index(name = "idx_applicant_stage", columnList = "stage_id"),
        @Index(name = "idx_applicant_status", columnList = "status"),
        @Index(name = "idx_applicant_email", columnList = "email")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Applicant extends BaseEntity {

    @Column(name = "partner_name", nullable = false, length = 255)
    private String partnerName;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "job_position_id")
    private UUID jobPositionId;

    @Column(name = "stage_id")
    private UUID stageId;

    @Column(name = "source", length = 255)
    private String source;

    @Column(name = "medium", length = 255)
    private String medium;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private ApplicantPriority priority = ApplicantPriority.NORMAL;

    @Column(name = "salary", precision = 12, scale = 2)
    private BigDecimal salary;

    @Column(name = "salary_currency", length = 10)
    private String salaryCurrency;

    @Column(name = "availability")
    private LocalDate availability;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "interview_notes", columnDefinition = "TEXT")
    private String interviewNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ApplicantStatus status = ApplicantStatus.NEW;
}
