package com.privod.platform.modules.russianDoc.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Акт списания.
 * Документ для списания ТМЦ, пришедших в негодность.
 */
@Entity
@Table(name = "write_off_act", indexes = {
        @Index(name = "idx_write_off_act_number", columnList = "number"),
        @Index(name = "idx_write_off_act_date", columnList = "date"),
        @Index(name = "idx_write_off_act_status", columnList = "status"),
        @Index(name = "idx_write_off_act_project", columnList = "project_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WriteOffAct extends BaseEntity {

    @Column(name = "number", nullable = false, length = 100)
    private String number;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "reason", length = 1000)
    private String reason;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "items", nullable = false, columnDefinition = "jsonb")
    private String items;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "commission_members", nullable = false, columnDefinition = "jsonb")
    private String commissionMembers;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private RussianDocStatus status = RussianDocStatus.DRAFT;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "project_id")
    private UUID projectId;

    public boolean canTransitionTo(RussianDocStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
