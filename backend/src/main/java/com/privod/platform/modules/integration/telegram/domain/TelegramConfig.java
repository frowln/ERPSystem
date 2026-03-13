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
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "telegram_configs", indexes = {
        @Index(name = "idx_tg_cfg_org", columnList = "organization_id", unique = true),
        @Index(name = "idx_tg_cfg_enabled", columnList = "enabled")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelegramConfig extends BaseEntity {

    @Column(name = "bot_token", nullable = false, length = 512)
    private String botToken;

    @Column(name = "bot_username", nullable = false, length = 255)
    private String botUsername;

    @Column(name = "webhook_url", length = 1000)
    private String webhookUrl;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private boolean enabled = false;

    @Column(name = "chat_ids", length = 2000)
    private String chatIds;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;
}
