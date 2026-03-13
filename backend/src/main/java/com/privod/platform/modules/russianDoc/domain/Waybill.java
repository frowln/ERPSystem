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

import java.time.LocalDate;
import java.util.UUID;

/**
 * Товарно-транспортная накладная (ТТН).
 * Согласно Постановлению Госкомстата РФ от 28.11.1997 N 78.
 */
@Entity
@Table(name = "waybill", indexes = {
        @Index(name = "idx_waybill_number", columnList = "number"),
        @Index(name = "idx_waybill_date", columnList = "date"),
        @Index(name = "idx_waybill_status", columnList = "status"),
        @Index(name = "idx_waybill_sender", columnList = "sender_id"),
        @Index(name = "idx_waybill_project", columnList = "project_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Waybill extends BaseEntity {

    @Column(name = "number", nullable = false, length = 100)
    private String number;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Column(name = "receiver_id", nullable = false)
    private UUID receiverId;

    @Column(name = "carrier_id")
    private UUID carrierId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "items", nullable = false, columnDefinition = "jsonb")
    private String items;

    @Column(name = "vehicle_number", length = 50)
    private String vehicleNumber;

    @Column(name = "driver_name", length = 255)
    private String driverName;

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
