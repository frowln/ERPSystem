package com.privod.platform.modules.hr.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "hr_staffing_positions", indexes = {
        @Index(name = "idx_staffing_pos_org", columnList = "organization_id"),
        @Index(name = "idx_staffing_pos_dept", columnList = "department")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffingPosition extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "department", nullable = false, length = 255)
    private String department;

    @Column(name = "position", nullable = false, length = 255)
    private String position;

    @Column(name = "grade", length = 50)
    private String grade;

    @Column(name = "salary_min", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal salaryMin = BigDecimal.ZERO;

    @Column(name = "salary_max", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal salaryMax = BigDecimal.ZERO;

    @Column(name = "filled_count")
    @Builder.Default
    private int filledCount = 0;

    @Column(name = "total_count")
    @Builder.Default
    private int totalCount = 1;
}
