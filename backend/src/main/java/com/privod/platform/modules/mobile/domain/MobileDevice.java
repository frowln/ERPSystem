package com.privod.platform.modules.mobile.domain;

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
@Table(name = "mobile_devices", indexes = {
        @Index(name = "idx_mobile_device_user", columnList = "user_id"),
        @Index(name = "idx_mobile_device_token", columnList = "device_token"),
        @Index(name = "idx_mobile_device_platform", columnList = "platform")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MobileDevice extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "device_token", nullable = false, length = 500)
    private String deviceToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "platform", nullable = false, length = 20)
    private MobilePlatform platform;

    @Column(name = "device_model", length = 200)
    private String deviceModel;

    @Column(name = "os_version", length = 100)
    private String osVersion;

    @Column(name = "app_version", length = 100)
    private String appVersion;

    @Column(name = "last_active_at")
    private Instant lastActiveAt;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
