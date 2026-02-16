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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "job_positions", indexes = {
        @Index(name = "idx_job_position_department", columnList = "department_id"),
        @Index(name = "idx_job_position_status", columnList = "status"),
        @Index(name = "idx_job_position_deadline", columnList = "deadline")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobPosition extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "expected_employees", nullable = false)
    @Builder.Default
    private int expectedEmployees = 1;

    @Column(name = "hired_employees", nullable = false)
    @Builder.Default
    private int hiredEmployees = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private JobPositionStatus status = JobPositionStatus.OPEN;

    @Column(name = "deadline")
    private LocalDate deadline;
}
