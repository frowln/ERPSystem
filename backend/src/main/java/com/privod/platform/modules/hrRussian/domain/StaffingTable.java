package com.privod.platform.modules.hrRussian.domain;

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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "staffing_table", indexes = {
        @Index(name = "idx_staffing_dept", columnList = "department_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffingTable extends BaseEntity {

    @Column(name = "position_name", nullable = false, length = 300)
    private String positionName;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "grade", length = 50)
    private String grade;

    @Column(name = "salary_min", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal salaryMin = BigDecimal.ZERO;

    @Column(name = "salary_max", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal salaryMax = BigDecimal.ZERO;

    @Column(name = "headcount", nullable = false)
    @Builder.Default
    private int headcount = 1;

    @Column(name = "filled_count", nullable = false)
    @Builder.Default
    private int filledCount = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    public int getVacancyCount() {
        return Math.max(0, headcount - filledCount);
    }
}
