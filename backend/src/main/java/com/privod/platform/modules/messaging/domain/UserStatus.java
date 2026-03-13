package com.privod.platform.modules.messaging.domain;

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
@Table(name = "user_statuses", indexes = {
        @Index(name = "idx_user_status_user", columnList = "user_id", unique = true),
        @Index(name = "idx_user_status_online", columnList = "is_online")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatus extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "status_text", length = 500)
    private String statusText;

    @Column(name = "status_emoji", length = 50)
    private String statusEmoji;

    @Column(name = "is_online", nullable = false)
    @Builder.Default
    private Boolean isOnline = false;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status", nullable = false, length = 30)
    @Builder.Default
    private AvailabilityStatus availabilityStatus = AvailabilityStatus.OFFLINE;
}
