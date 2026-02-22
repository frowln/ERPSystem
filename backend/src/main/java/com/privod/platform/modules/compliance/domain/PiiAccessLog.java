package com.privod.platform.modules.compliance.domain;

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

import java.time.Instant;
import java.util.UUID;

/**
 * Журнал доступа к персональным данным (ПДн).
 * <p>
 * Не имеет @Filter(tenantFilter) — доступен только администраторам и
 * ответственным за соблюдение требований 152-ФЗ.
 */
@Entity
@Table(name = "pii_access_logs", indexes = {
        @Index(name = "idx_pal_org", columnList = "organization_id"),
        @Index(name = "idx_pal_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_pal_user", columnList = "user_id"),
        @Index(name = "idx_pal_accessed", columnList = "accessed_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PiiAccessLog extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "field_name", nullable = false, length = 100)
    private String fieldName;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_type", nullable = false, length = 20)
    private PiiAccessType accessType;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "accessed_at", nullable = false)
    @Builder.Default
    private Instant accessedAt = Instant.now();
}
