package com.privod.platform.modules.hrRussian.domain;

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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "employment_orders", indexes = {
        @Index(name = "idx_order_employee", columnList = "employee_id"),
        @Index(name = "idx_order_type", columnList = "order_type"),
        @Index(name = "idx_order_date", columnList = "order_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmploymentOrder extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "order_number", nullable = false, length = 50)
    private String orderNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false, length = 30)
    private OrderType orderType;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "basis", length = 500)
    private String basis;

    @Column(name = "signed_by_id")
    private UUID signedById;
}
