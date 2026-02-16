package com.privod.platform.modules.integration.sms.domain;

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

@Entity
@Table(name = "sms_messages", indexes = {
        @Index(name = "idx_sms_msg_phone", columnList = "phone_number"),
        @Index(name = "idx_sms_msg_channel", columnList = "channel"),
        @Index(name = "idx_sms_msg_status", columnList = "status"),
        @Index(name = "idx_sms_msg_sent_at", columnList = "sent_at"),
        @Index(name = "idx_sms_msg_user", columnList = "user_id"),
        @Index(name = "idx_sms_msg_entity", columnList = "related_entity_type, related_entity_id"),
        @Index(name = "idx_sms_msg_external", columnList = "external_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmsMessage extends BaseEntity {

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "message_text", nullable = false, columnDefinition = "TEXT")
    private String messageText;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false, length = 15)
    @Builder.Default
    private SmsChannel channel = SmsChannel.SMS;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 15)
    @Builder.Default
    private SmsMessageStatus status = SmsMessageStatus.PENDING;

    @Column(name = "error_message", length = 2000)
    private String errorMessage;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "external_id", length = 255)
    private String externalId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "related_entity_type", length = 100)
    private String relatedEntityType;

    @Column(name = "related_entity_id")
    private UUID relatedEntityId;
}
