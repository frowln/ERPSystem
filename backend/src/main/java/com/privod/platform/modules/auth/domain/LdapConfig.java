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
@Table(name = "ldap_configs", indexes = {
        @Index(name = "idx_ldap_configs_org", columnList = "organization_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LdapConfig extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "server_url", nullable = false, length = 1000)
    private String serverUrl;

    @Column(name = "base_dn", nullable = false, length = 500)
    private String baseDn;

    @Column(name = "bind_dn", length = 500)
    private String bindDn;

    @Column(name = "bind_password", length = 500)
    private String bindPassword;

    @Column(name = "user_search_base", length = 500)
    @Builder.Default
    private String userSearchBase = "OU=Users";

    @Column(name = "user_search_filter", length = 500)
    @Builder.Default
    private String userSearchFilter = "(sAMAccountName={0})";

    @Column(name = "group_search_base", length = 500)
    @Builder.Default
    private String groupSearchBase = "OU=Groups";

    @Column(name = "group_search_filter", length = 500)
    @Builder.Default
    private String groupSearchFilter = "(member={0})";

    @Column(name = "attribute_mapping", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private String attributeMapping = "{\"email\":\"mail\",\"firstName\":\"givenName\",\"lastName\":\"sn\",\"username\":\"sAMAccountName\"}";

    @Column(name = "group_role_mapping", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private String groupRoleMapping = "{}";

    @Column(name = "use_ssl", nullable = false)
    @Builder.Default
    private boolean useSsl = false;

    @Column(name = "use_starttls", nullable = false)
    @Builder.Default
    private boolean useStarttls = false;

    @Column(name = "connection_timeout_ms")
    @Builder.Default
    private Integer connectionTimeoutMs = 5000;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "auto_provision_users", nullable = false)
    @Builder.Default
    private boolean autoProvisionUsers = true;

    @Column(name = "sync_interval_minutes")
    @Builder.Default
    private Integer syncIntervalMinutes = 60;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    @Column(name = "last_sync_status", length = 50)
    private String lastSyncStatus;

    @Column(name = "last_sync_message", columnDefinition = "TEXT")
    private String lastSyncMessage;
}
