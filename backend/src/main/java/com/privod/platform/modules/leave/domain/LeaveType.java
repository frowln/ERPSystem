package com.privod.platform.modules.leave.domain;

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

@Entity
@Table(name = "leave_types", indexes = {
        @Index(name = "idx_leave_type_code", columnList = "code", unique = true),
        @Index(name = "idx_leave_type_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveType extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "color", length = 20)
    private String color;

    @Column(name = "max_days", precision = 5, scale = 1)
    private BigDecimal maxDays;

    @Column(name = "requires_approval", nullable = false)
    @Builder.Default
    private boolean requiresApproval = true;

    @Column(name = "allow_negative", nullable = false)
    @Builder.Default
    private boolean allowNegative = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "validity_start")
    private LocalDate validityStart;

    @Column(name = "validity_end")
    private LocalDate validityEnd;
}
