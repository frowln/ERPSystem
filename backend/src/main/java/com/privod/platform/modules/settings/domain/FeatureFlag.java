package com.privod.platform.modules.settings.domain;

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

@Entity
@Table(name = "feature_flags", indexes = {
        @Index(name = "idx_feature_flag_key", columnList = "flag_key", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureFlag extends BaseEntity {

    @Column(name = "flag_key", nullable = false, unique = true, length = 100)
    private String key;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private boolean enabled = false;

    @Column(name = "organization_scoped", nullable = false)
    @Builder.Default
    private boolean organizationScoped = false;

    @Column(name = "rollout_percentage")
    @Builder.Default
    private Integer rolloutPercentage = 100;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "target_user_ids", columnDefinition = "JSONB")
    @Builder.Default
    private String targetUserIds = "[]";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "target_organization_ids", columnDefinition = "JSONB")
    @Builder.Default
    private String targetOrganizationIds = "[]";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "variants", columnDefinition = "JSONB")
    private String variants;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "JSONB")
    @Builder.Default
    private String metadata = "{}";
}
