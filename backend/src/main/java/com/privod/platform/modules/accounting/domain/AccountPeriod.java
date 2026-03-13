package com.privod.platform.modules.accounting.domain;

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

@Entity
@Table(name = "account_periods", indexes = {
        @Index(name = "idx_account_period_org", columnList = "organization_id"),
        @Index(name = "idx_account_period_status", columnList = "status"),
        @Index(name = "idx_account_period_year_month", columnList = "year, month")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountPeriod extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "month", nullable = false)
    private Integer month;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 10)
    @Builder.Default
    private PeriodStatus status = PeriodStatus.OPEN;

    @Column(name = "closed_by_id")
    private UUID closedById;

    @Column(name = "closed_at")
    private Instant closedAt;

    public boolean isOpen() {
        return status == PeriodStatus.OPEN;
    }
}
