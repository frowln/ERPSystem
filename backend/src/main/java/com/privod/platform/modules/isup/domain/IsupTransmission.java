package com.privod.platform.modules.isup.domain;

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
@Table(name = "isup_transmissions", indexes = {
        @Index(name = "idx_isup_tx_org", columnList = "organization_id"),
        @Index(name = "idx_isup_tx_mapping", columnList = "project_mapping_id"),
        @Index(name = "idx_isup_tx_type", columnList = "transmission_type"),
        @Index(name = "idx_isup_tx_status", columnList = "status"),
        @Index(name = "idx_isup_tx_sent", columnList = "sent_at"),
        @Index(name = "idx_isup_tx_external", columnList = "external_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IsupTransmission extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_mapping_id", nullable = false)
    private UUID projectMappingId;

    @Enumerated(EnumType.STRING)
    @Column(name = "transmission_type", nullable = false, length = 30)
    private IsupTransmissionType transmissionType;

    @Column(name = "payload_json", columnDefinition = "TEXT")
    private String payloadJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private IsupTransmissionStatus status = IsupTransmissionStatus.PENDING;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private int retryCount = 0;

    @Column(name = "external_id", length = 255)
    private String externalId;
}
