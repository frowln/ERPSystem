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
@Table(name = "isup_verification_records", indexes = {
        @Index(name = "idx_isup_vr_org", columnList = "organization_id"),
        @Index(name = "idx_isup_vr_tx", columnList = "transmission_id"),
        @Index(name = "idx_isup_vr_type", columnList = "verification_type"),
        @Index(name = "idx_isup_vr_verified_at", columnList = "verified_at")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IsupVerificationRecord extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "transmission_id", nullable = false)
    private UUID transmissionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_type", nullable = false, length = 30)
    private IsupVerificationType verificationType;

    @Column(name = "verified_by_name", length = 255)
    private String verifiedByName;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "external_reference", length = 255)
    private String externalReference;
}
