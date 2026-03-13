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
@Table(name = "mail_notifications", indexes = {
        @Index(name = "idx_mail_notification_message", columnList = "message_id"),
        @Index(name = "idx_mail_notification_user", columnList = "user_id"),
        @Index(name = "idx_mail_notification_is_read", columnList = "is_read"),
        @Index(name = "idx_mail_notification_type", columnList = "notification_type"),
        @Index(name = "idx_mail_notification_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MailNotification extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean isRead = false;

    @Column(name = "read_at")
    private Instant readAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 20)
    @Builder.Default
    private MailNotificationType notificationType = MailNotificationType.INBOX;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MailNotificationStatus status = MailNotificationStatus.READY;

    @Column(name = "failure_type", length = 255)
    private String failureType;

    public void markRead() {
        this.isRead = true;
        this.readAt = Instant.now();
    }
}
