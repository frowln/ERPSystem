package com.privod.platform.modules.notification.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "notification_preferences",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_notif_pref_user_org_channel_category",
                        columnNames = {"user_id", "organization_id", "channel", "category"}
                )
        },
        indexes = {
                @Index(name = "idx_notif_pref_user_org", columnList = "user_id, organization_id")
        }
)
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreference extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false, length = 20)
    private NotificationChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private NotificationCategory category;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private boolean enabled = true;
}
