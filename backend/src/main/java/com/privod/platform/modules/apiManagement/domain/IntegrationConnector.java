package com.privod.platform.modules.apiManagement.domain;

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
@Table(name = "integration_connectors", indexes = {
        @Index(name = "idx_ic_category", columnList = "category"),
        @Index(name = "idx_ic_slug", columnList = "slug"),
        @Index(name = "idx_ic_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegrationConnector extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "slug", nullable = false, unique = true, length = 100)
    private String slug;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private ConnectorCategory category;

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Column(name = "documentation_url", length = 500)
    private String documentationUrl;

    @Column(name = "api_base_url", length = 500)
    private String apiBaseUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_type", nullable = false, length = 30)
    @Builder.Default
    private ConnectorAuthType authType = ConnectorAuthType.API_KEY;

    @Column(name = "is_first_party", nullable = false)
    @Builder.Default
    private boolean isFirstParty = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "config_schema_json", columnDefinition = "TEXT")
    private String configSchemaJson;
}
