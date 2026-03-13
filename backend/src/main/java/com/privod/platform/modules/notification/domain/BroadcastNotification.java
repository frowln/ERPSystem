package com.privod.platform.modules.notification.domain;

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
@Table(name = "broadcast_notifications", indexes = {
        @Index(name = "idx_broadcast_org_active", columnList = "organization_id, active"),
        @Index(name = "idx_broadcast_created_at", columnList = "created_at"),
        @Index(name = "idx_broadcast_expires_at", columnList = "expires_at")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BroadcastNotification extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private BroadcastType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private BroadcastPriority priority = BroadcastPriority.NORMAL;

    @Column(name = "broadcast_created_by", nullable = false)
    private UUID broadcastCreatedBy;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;

    public void deactivate() {
        this.active = false;
    }
}
