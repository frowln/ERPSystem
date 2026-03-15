package com.privod.platform.modules.auth.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "saml_providers", indexes = {
        @Index(name = "idx_saml_providers_org", columnList = "organization_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SamlProvider extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "entity_id", nullable = false, length = 1000)
    private String entityId;

    @Column(name = "idp_entity_id", nullable = false, length = 1000)
    private String idpEntityId;

    @Column(name = "idp_sso_url", nullable = false, length = 2000)
    private String idpSsoUrl;

    @Column(name = "idp_slo_url", length = 2000)
    private String idpSloUrl;

    @Column(name = "idp_certificate", nullable = false, columnDefinition = "TEXT")
    private String idpCertificate;

    @Column(name = "sp_certificate", columnDefinition = "TEXT")
    private String spCertificate;

    @Column(name = "sp_private_key", columnDefinition = "TEXT")
    private String spPrivateKey;

    @Column(name = "name_id_format", length = 255)
    @Builder.Default
    private String nameIdFormat = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress";

    @Column(name = "attribute_mapping", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private String attributeMapping = "{\"email\":\"email\",\"firstName\":\"givenName\",\"lastName\":\"sn\"}";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "auto_provision_users", nullable = false)
    @Builder.Default
    private boolean autoProvisionUsers = true;

    @Column(name = "default_role", length = 50)
    @Builder.Default
    private String defaultRole = "VIEWER";

    @Column(name = "icon_url", length = 1000)
    private String iconUrl;
}
