package com.privod.platform.modules.apiManagement.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "api_keys", indexes = {
        @Index(name = "idx_api_key_prefix", columnList = "prefix"),
        @Index(name = "idx_api_key_user", columnList = "user_id"),
        @Index(name = "idx_api_key_active", columnList = "is_active"),
        @Index(name = "idx_api_key_hash", columnList = "key_hash", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiKey extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "key_hash", nullable = false, unique = true, length = 255)
    private String keyHash;

    @Column(name = "prefix", nullable = false, length = 8)
    private String prefix;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "scopes", columnDefinition = "JSONB")
    @Builder.Default
    private String scopes = "[]";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(name = "request_count", nullable = false)
    @Builder.Default
    private long requestCount = 0;

    @Column(name = "rate_limit", nullable = false)
    @Builder.Default
    private int rateLimit = 60;
}
