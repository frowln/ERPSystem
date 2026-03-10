package com.privod.platform.modules.admin.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity(name = "AdminNotificationPreference")
@Table(name = "notification_preferences")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificationPreference {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "role_code", length = 50)
    private String roleCode;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "channel_email", nullable = false)
    @Builder.Default
    private boolean channelEmail = true;

    @Column(name = "channel_push", nullable = false)
    @Builder.Default
    private boolean channelPush = true;

    @Column(name = "channel_telegram", nullable = false)
    @Builder.Default
    private boolean channelTelegram = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
