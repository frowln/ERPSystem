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

@Entity
@Table(name = "sms_configs", indexes = {
        @Index(name = "idx_sms_cfg_provider", columnList = "provider"),
        @Index(name = "idx_sms_cfg_enabled", columnList = "enabled")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmsConfig extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 30)
    private SmsProvider provider;

    @Column(name = "api_url", length = 1000)
    private String apiUrl;

    @Column(name = "api_key", length = 500)
    private String apiKey;

    @Column(name = "sender_name", length = 50)
    private String senderName;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private boolean enabled = false;

    @Column(name = "whatsapp_enabled", nullable = false)
    @Builder.Default
    private boolean whatsappEnabled = false;
}
