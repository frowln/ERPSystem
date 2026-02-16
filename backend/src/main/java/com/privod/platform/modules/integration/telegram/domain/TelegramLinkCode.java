package com.privod.platform.modules.integration.telegram.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "telegram_link_codes", indexes = {
        @Index(name = "idx_tg_link_code", columnList = "code", unique = true),
        @Index(name = "idx_tg_link_user", columnList = "user_id"),
        @Index(name = "idx_tg_link_expires", columnList = "expires_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelegramLinkCode extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 32)
    private String code;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used", nullable = false)
    @Builder.Default
    private boolean used = false;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "chat_id", length = 100)
    private String chatId;

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public boolean isValid() {
        return !used && !isExpired() && !isDeleted();
    }

    public void markUsed(String chatId) {
        this.used = true;
        this.usedAt = Instant.now();
        this.chatId = chatId;
    }
}
