package com.privod.platform.modules.integration.domain;

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

@Entity
@Table(name = "sbis_configs", indexes = {
        @Index(name = "idx_sbis_cfg_name", columnList = "name"),
        @Index(name = "idx_sbis_cfg_active", columnList = "is_active"),
        @Index(name = "idx_sbis_cfg_inn", columnList = "organization_inn")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SbisConfig extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "api_url", nullable = false, length = 1000)
    private String apiUrl;

    @Column(name = "login", nullable = false, length = 255)
    private String login;

    @Column(name = "password", nullable = false, columnDefinition = "TEXT")
    private String password;

    @Column(name = "certificate_thumbprint", length = 255)
    private String certificateThumbprint;

    @Column(name = "organization_inn", nullable = false, length = 12)
    private String organizationInn;

    @Column(name = "organization_kpp", length = 9)
    private String organizationKpp;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "auto_send", nullable = false)
    @Builder.Default
    private boolean autoSend = false;
}
