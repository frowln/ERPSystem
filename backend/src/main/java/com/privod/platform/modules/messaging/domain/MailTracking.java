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
@Table(name = "mail_tracking", indexes = {
        @Index(name = "idx_mail_tracking_message", columnList = "message_id"),
        @Index(name = "idx_mail_tracking_recipient", columnList = "recipient_email"),
        @Index(name = "idx_mail_tracking_status", columnList = "status"),
        @Index(name = "idx_mail_tracking_sent_at", columnList = "sent_at")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MailTracking extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "recipient_email", nullable = false, length = 500)
    private String recipientEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MailTrackingStatus status = MailTrackingStatus.SENT;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "opened_at")
    private Instant openedAt;

    @Column(name = "error_message", length = 2000)
    private String errorMessage;
}
