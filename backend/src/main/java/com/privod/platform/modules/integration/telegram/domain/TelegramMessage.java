package com.privod.platform.modules.integration.telegram.domain;

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
@Table(name = "telegram_messages", indexes = {
        @Index(name = "idx_tg_msg_chat", columnList = "chat_id"),
        @Index(name = "idx_tg_msg_status", columnList = "status"),
        @Index(name = "idx_tg_msg_type", columnList = "message_type"),
        @Index(name = "idx_tg_msg_sent_at", columnList = "sent_at"),
        @Index(name = "idx_tg_msg_related", columnList = "related_entity_type, related_entity_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelegramMessage extends BaseEntity {

    @Column(name = "chat_id", nullable = false, length = 100)
    private String chatId;

    @Column(name = "message_text", nullable = false, columnDefinition = "TEXT")
    private String messageText;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 30)
    private TelegramMessageType messageType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TelegramMessageStatus status = TelegramMessageStatus.PENDING;

    @Column(name = "error_message", length = 2000)
    private String errorMessage;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "related_entity_type", length = 100)
    private String relatedEntityType;

    @Column(name = "related_entity_id")
    private UUID relatedEntityId;

    public void markSent() {
        this.status = TelegramMessageStatus.SENT;
        this.sentAt = Instant.now();
    }

    public void markFailed(String error) {
        this.status = TelegramMessageStatus.FAILED;
        this.errorMessage = error;
    }
}
