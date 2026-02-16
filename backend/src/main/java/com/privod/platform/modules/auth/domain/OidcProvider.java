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

@Entity
@Table(name = "oidc_providers", indexes = {
        @Index(name = "idx_oidc_provider_code", columnList = "code", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OidcProvider extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "client_id", nullable = false, length = 500)
    private String clientId;

    @Column(name = "client_secret", nullable = false, length = 500)
    private String clientSecret;

    @Column(name = "authorization_url", nullable = false, length = 1000)
    private String authorizationUrl;

    @Column(name = "token_url", nullable = false, length = 1000)
    private String tokenUrl;

    @Column(name = "user_info_url", length = 1000)
    private String userInfoUrl;

    @Column(name = "scope", nullable = false, length = 500)
    @Builder.Default
    private String scope = "openid email profile";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "icon_url", length = 1000)
    private String iconUrl;
}
