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
 * ТОРГ-12 - Товарная накладная.
 * Согласно Постановлению Госкомстата РФ от 25.12.1998 N 132.
 */
@Entity
@Table(name = "torg12", indexes = {
        @Index(name = "idx_torg12_number", columnList = "number"),
        @Index(name = "idx_torg12_date", columnList = "date"),
        @Index(name = "idx_torg12_status", columnList = "status"),
        @Index(name = "idx_torg12_supplier", columnList = "supplier_id"),
        @Index(name = "idx_torg12_project", columnList = "project_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Torg12 extends BaseEntity {

    @Column(name = "number", nullable = false, length = 100)
    private String number;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "supplier_id", nullable = false)
    private UUID supplierId;

    @Column(name = "receiver_id", nullable = false)
    private UUID receiverId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "items", nullable = false, columnDefinition = "jsonb")
    private String items;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "vat_amount", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal vatAmount = BigDecimal.ZERO;

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
