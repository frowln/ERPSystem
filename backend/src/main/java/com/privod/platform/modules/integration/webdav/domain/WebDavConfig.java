package com.privod.platform.modules.integration.webdav.domain;

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
@Table(name = "webdav_configs", indexes = {
        @Index(name = "idx_webdav_cfg_enabled", columnList = "enabled"),
        @Index(name = "idx_webdav_cfg_org", columnList = "organization_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebDavConfig extends BaseEntity {

    @Column(name = "server_url", nullable = false, length = 1000)
    private String serverUrl;

    @Column(name = "username", nullable = false, length = 255)
    private String username;

    @Column(name = "password", nullable = false, columnDefinition = "TEXT")
    private String password;

    @Column(name = "base_path", nullable = false, length = 500)
    @Builder.Default
    private String basePath = "/privod/";

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private boolean enabled = false;

    @Column(name = "max_file_size_mb", nullable = false)
    @Builder.Default
    private int maxFileSizeMb = 100;

    @Column(name = "organization_id")
    private UUID organizationId;
}
