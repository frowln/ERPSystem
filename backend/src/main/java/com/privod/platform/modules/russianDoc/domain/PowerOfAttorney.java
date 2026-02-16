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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Доверенность М-2 на получение ТМЦ.
 * Согласно Постановлению Госкомстата РФ от 30.10.1997 N 71а.
 */
@Entity
@Table(name = "power_of_attorney", indexes = {
        @Index(name = "idx_poa_number", columnList = "number"),
        @Index(name = "idx_poa_date", columnList = "date"),
        @Index(name = "idx_poa_status", columnList = "status"),
        @Index(name = "idx_poa_issued_to", columnList = "issued_to_id"),
        @Index(name = "idx_poa_valid_until", columnList = "valid_until"),
        @Index(name = "idx_poa_project", columnList = "project_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PowerOfAttorney extends BaseEntity {

    @Column(name = "number", nullable = false, length = 100)
    private String number;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "issued_to_id", nullable = false)
    private UUID issuedToId;

    @Column(name = "purpose", length = 1000)
    private String purpose;

    @Column(name = "valid_until", nullable = false)
    private LocalDate validUntil;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "material_list", nullable = false, columnDefinition = "jsonb")
    private String materialList;

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

    public boolean isExpired() {
        return validUntil != null && validUntil.isBefore(LocalDate.now());
    }
}
