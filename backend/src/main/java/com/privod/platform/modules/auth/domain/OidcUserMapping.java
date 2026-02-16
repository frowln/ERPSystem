package com.privod.platform.modules.auth.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "oidc_user_mappings", indexes = {
        @Index(name = "idx_oidc_mapping_provider", columnList = "oidc_provider_id"),
        @Index(name = "idx_oidc_mapping_internal", columnList = "internal_user_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_oidc_mapping",
                columnNames = {"oidc_provider_id", "external_user_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OidcUserMapping extends BaseEntity {

    @Column(name = "oidc_provider_id", nullable = false)
    private UUID oidcProviderId;

    @Column(name = "external_user_id", nullable = false, length = 500)
    private String externalUserId;

    @Column(name = "internal_user_id", nullable = false)
    private UUID internalUserId;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "linked_at", nullable = false)
    @Builder.Default
    private Instant linkedAt = Instant.now();
}
