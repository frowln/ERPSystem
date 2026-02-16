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

import java.time.Instant;

@Entity
@Table(name = "idempotency_records", indexes = {
        @Index(name = "idx_idempotency_key", columnList = "idempotency_key", unique = true),
        @Index(name = "idx_idempotency_status", columnList = "status"),
        @Index(name = "idx_idempotency_expires_at", columnList = "expires_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdempotencyRecord extends BaseEntity {

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 255)
    private String idempotencyKey;

    @Column(name = "request_hash", length = 255)
    private String requestHash;

    @Column(name = "response_data", columnDefinition = "TEXT")
    private String responseData;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private IdempotencyStatus status = IdempotencyStatus.PROCESSING;

    @Column(name = "record_created_at", nullable = false)
    @Builder.Default
    private Instant recordCreatedAt = Instant.now();

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
}
